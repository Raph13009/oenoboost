import json
import os
import re
import subprocess
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


INPUT_PATH_NAME = "appellations_clean.json"
CHUNK_SIZE = 50
MAX_TIMEOUT_SPLITS = 3  # 50 -> 25 -> 12 -> 6 (max)

APP_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"

PLACEHOLDER_SUBREGION = {
    "name_fr": "À classifier",
    "name_en": "To classify",
    "slug": "a-classifier",
    "status": "draft",
}


def get_any_region_id(supabase) -> str:
    # Some schemas require `region_id` NOT NULL on wine_subregions.
    # We reuse an existing region_id to build the placeholder.
    res = supabase.table(SUBREGION_TABLE).select("region_id").limit(1).execute()
    data = getattr(res, "data", None)
    if data is None and hasattr(res, "get"):
        data = res.get("data")  # type: ignore[union-attr]
    if not data or not data[0].get("region_id"):
        raise RuntimeError(
            "Impossible de trouver un region_id existant dans wine_subregions."
        )
    return str(data[0]["region_id"])


def chunked(seq, chunk_size: int):
    for i in range(0, len(seq), chunk_size):
        yield seq[i : i + chunk_size]


def is_statement_timeout_error(err: Exception) -> bool:
    msg = str(err).lower()
    return "statement timeout" in msg or "57014" in msg


def insert_rows_with_timeout_fallback(supabase, table_name: str, rows, depth: int):
    """
    Essaie d'insérer `rows`. En cas de statement timeout, réduit la taille de batch
    (50 -> 25 -> 12 -> 6) via découpage récursif.
    Retourne le nombre de lignes insérées.
    """
    if not rows:
        return 0

    try:
        supabase.table(table_name).insert(rows).execute()
        return len(rows)
    except Exception as e:
        if not is_statement_timeout_error(e) or depth >= MAX_TIMEOUT_SPLITS or len(rows) == 1:
            raise

        mid = len(rows) // 2
        left = rows[:mid]
        right = rows[mid:]
        return insert_rows_with_timeout_fallback(
            supabase, table_name, left, depth + 1
        ) + insert_rows_with_timeout_fallback(
            supabase, table_name, right, depth + 1
        )


def slugify(value: str) -> str:
    """
    lowercase, accents retirés, espaces/ponctuation -> '-', tirets dédoublonnés.
    """
    value = value.strip().lower()
    value_no_accents = "".join(
        ch
        for ch in unicodedata.normalize("NFD", value)
        if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value_no_accents)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def get_placeholder_subregion_id(supabase) -> str:
    # 2) Crée d'abord UNE SEULE ligne "placeholder" (ou récupère son id si existante)
    slug = PLACEHOLDER_SUBREGION["slug"]

    res = (
        supabase.table(SUBREGION_TABLE)
        .select("id")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    data = getattr(res, "data", None)
    if data is None and hasattr(res, "get"):
        data = res.get("data")  # type: ignore[union-attr]
    if data and len(data) > 0 and data[0].get("id") is not None:
        return str(data[0]["id"])

    # Insertion du placeholder, puis récupération de l'id
    region_id = get_any_region_id(supabase)
    placeholder_payload = {**PLACEHOLDER_SUBREGION, "region_id": region_id}
    insert_res = (
        supabase.table(SUBREGION_TABLE)
        .insert([placeholder_payload])
        .execute()
    )
    insert_data = getattr(insert_res, "data", None)
    if insert_data is None and hasattr(insert_res, "get"):
        insert_data = insert_res.get("data")  # type: ignore[union-attr]
    if not insert_data or insert_data[0].get("id") is None:
        raise RuntimeError(
            "Impossible de récupérer l'id du placeholder wine_subregion."
        )
    return str(insert_data[0]["id"])


def main() -> None:
    load_dotenv(Path(__file__).resolve().parent / ".env")

    # Certains projets exposent la URL sous `NEXT_PUBLIC_SUPABASE_URL` seulement.
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url:
        raise EnvironmentError(
            "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) manquante dans .env"
        )
    if not supabase_service_role_key:
        raise EnvironmentError("SUPABASE_SERVICE_ROLE_KEY manquante dans .env")

    # Le client supabase-py attend des clés JWT (elles contiennent généralement des '.').
    # Les valeurs du type `sb_secret_...` (sandbox/placeholder) ne fonctionneront pas.
    if "." not in supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY invalide: attendu une clé JWT (format contenant des '.'). "
            "Vérifie la valeur dans .env."
        )

    supabase = create_client(supabase_url, supabase_service_role_key)

    repo_root = Path(__file__).resolve().parent
    in_path = repo_root / INPUT_PATH_NAME
    if not in_path.exists():
        # Objectif pipeline : préparer d'abord appellations_clean.json
        subprocess.run(
            ["python3", "prepare_appellations.py"],
            cwd=str(repo_root),
            check=True,
        )
    if not in_path.exists():
        raise FileNotFoundError(f"{INPUT_PATH_NAME} introuvable après préparation.")

    with in_path.open("r", encoding="utf-8") as f:
        appellations = json.load(f)

    placeholder_subregion_id = get_placeholder_subregion_id(supabase)

    batches = (len(appellations) + CHUNK_SIZE - 1) // CHUNK_SIZE
    inserted_total = 0
    # Optionnel : limiter à certains numéros de batch (ex: "4,6,7")
    batch_numbers_raw = os.getenv("BATCH_NUMBERS")
    batch_numbers = None
    if batch_numbers_raw:
        try:
            batch_numbers = {int(x.strip()) for x in batch_numbers_raw.split(",") if x.strip()}
        except ValueError:
            batch_numbers = None

    for batch_idx, chunk in enumerate(chunked(appellations, CHUNK_SIZE), start=1):
        if batch_numbers is not None and batch_idx not in batch_numbers:
            continue

        batch_rows = []
        for entry in chunk:
            batch_rows.append(
                {
                    "subregion_id": placeholder_subregion_id,
                    "name_fr": entry["name_fr"],
                    "name_en": entry["name_fr"],
                    "slug": slugify(entry["name_fr"]),
                    "geojson": entry["geojson"],  # dict GeoJSON, pas une string
                    "centroid_lat": entry["centroid_lat"],
                    "centroid_lng": entry["centroid_lng"],
                    "status": "draft",
                    "is_premium": True,
                }
            )

        try:
            inserted_count = insert_rows_with_timeout_fallback(
                supabase, APP_TABLE, batch_rows, depth=0
            )
            inserted_total += inserted_count
            print(f"Batch {batch_idx}/{batches} → ✓")
        except Exception as e:
            print(f"Batch {batch_idx}/{batches} → erreur: {e}")
            continue

    print(f"✓ {inserted_total} appellations insérées sur {len(appellations)}")


if __name__ == "__main__":
    main()

