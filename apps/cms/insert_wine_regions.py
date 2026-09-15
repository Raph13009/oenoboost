import os
import re
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


REGION_TABLE = "wine_regions"
REGION_NAMES = [
    "Bordeaux",
    "Bourgogne",
    "Champagne",
    "Vallée du Rhône",
    "Vallée de la Loire",
    "Alsace",
    "Languedoc-Roussillon",
    "Provence",
    "Sud-Ouest",
    "Jura",
    "Savoie",
    "Corse",
    "Beaujolais",
]

REGION_NAME_EN = {
    "Bordeaux": "Bordeaux",
    "Bourgogne": "Burgundy",
    "Champagne": "Champagne",
    "Vallée du Rhône": "Rhone Valley",
    "Vallée de la Loire": "Loire Valley",
    "Alsace": "Alsace",
    "Languedoc-Roussillon": "Languedoc-Roussillon",
    "Provence": "Provence",
    "Sud-Ouest": "South West",
    "Jura": "Jura",
    "Savoie": "Savoy",
    "Corse": "Corsica",
    "Beaujolais": "Beaujolais",
}


def slugify(value: str) -> str:
    value = value.strip().lower()
    value_no_accents = "".join(
        ch
        for ch in unicodedata.normalize("NFD", value)
        if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value_no_accents)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def get_response_data(response):
    data = getattr(response, "data", None)
    if data is None and hasattr(response, "get"):
        data = response.get("data")  # type: ignore[union-attr]
    return data


def main() -> None:
    repo_root = Path(__file__).resolve().parent
    load_dotenv(repo_root / ".env")

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url:
        raise EnvironmentError("SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL manquante dans .env")
    if not supabase_service_role_key:
        raise EnvironmentError("SUPABASE_SERVICE_ROLE_KEY manquante dans .env")

    supabase = create_client(supabase_url, supabase_service_role_key)

    payload = [
        {
            "name_fr": name,
            "name_en": REGION_NAME_EN[name],
            "slug": slugify(name),
        }
        for name in REGION_NAMES
    ]
    supabase.table(REGION_TABLE).upsert(payload, on_conflict="slug").execute()

    slugs = [row["slug"] for row in payload]
    response = supabase.table(REGION_TABLE).select("id,slug").in_("slug", slugs).execute()
    rows = get_response_data(response) or []

    print(f"✓ {len(rows)} régions créées")


if __name__ == "__main__":
    main()
