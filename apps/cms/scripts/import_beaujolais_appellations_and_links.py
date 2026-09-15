import os
import re
import time
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from shapely.geometry import Point, mapping, shape
from supabase import ClientOptions, create_client


APPELLATION_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"
CHUNK_SIZE = 100
MAX_RETRIES = 5

TARGET_AOP_TO_SUBREGION = {
    "beaujolais": "beaujolais",
    "beaujolais-superieur": "beaujolais",
    "beaujolais-blanc": "beaujolais",
    "beaujolais-villages": "beaujolais-villages",
    "saint-amour": "beaujolais-crus",
    "julienas": "beaujolais-crus",
    "chenas": "beaujolais-crus",
    "moulin-a-vent": "beaujolais-crus",
    "fleurie": "beaujolais-crus",
    "chiroubles": "beaujolais-crus",
    "morgon": "beaujolais-crus",
    "regnie": "beaujolais-crus",
    "brouilly": "beaujolais-crus",
    "cote-de-brouilly": "beaujolais-crus",
}

FALLBACK_FROM_BASE = {
    "beaujolais-superieur": "beaujolais",
    "beaujolais-blanc": "beaujolais",
}

DISPLAY_NAME_BY_SLUG = {
    "beaujolais": "Beaujolais",
    "beaujolais-superieur": "Beaujolais Supérieur",
    "beaujolais-blanc": "Beaujolais Blanc",
    "beaujolais-villages": "Beaujolais Villages",
    "saint-amour": "Saint-Amour",
    "julienas": "Juliénas",
    "chenas": "Chénas",
    "moulin-a-vent": "Moulin-à-Vent",
    "fleurie": "Fleurie",
    "chiroubles": "Chiroubles",
    "morgon": "Morgon",
    "regnie": "Régnié",
    "brouilly": "Brouilly",
    "cote-de-brouilly": "Côte de Brouilly",
}


def chunked(seq, size: int):
    for idx in range(0, len(seq), size):
        yield seq[idx : idx + size]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    value = re.sub(r"-{2,}", "-", value)
    return value


def safe_execute(builder):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return builder.execute()
        except Exception as err:  # noqa: BLE001
            last_error = err
            if attempt == MAX_RETRIES:
                raise
            time.sleep(1.2 * attempt)
    raise RuntimeError(f"Echec execute apres retries: {last_error}")


def is_statement_timeout_error(err: Exception) -> bool:
    msg = str(err).lower()
    return "statement timeout" in msg or "57014" in msg


def upsert_appellation_resilient(supabase, row: dict) -> None:
    base_payload = {
        "slug": row["slug"],
        "name_fr": row["name_fr"],
        "name_en": row["name_en"],
        "geojson": row["geojson"],
        "centroid_lat": row["centroid_lat"],
        "centroid_lng": row["centroid_lng"],
        "is_premium": row["is_premium"],
        "status": row["status"],
    }
    try:
        safe_execute(supabase.table(APPELLATION_TABLE).upsert([base_payload], on_conflict="slug"))
        return
    except Exception as err:  # noqa: BLE001
        if not is_statement_timeout_error(err):
            raise

    # Fallback: simplify geometry progressively if full payload times out.
    geom = shape(extract_geometry(row["geojson"]))
    for tolerance in (0.0003, 0.0007, 0.0015, 0.003):
        simplified = geom.simplify(tolerance=tolerance, preserve_topology=True)
        if simplified.is_empty:
            continue
        payload = {
            **base_payload,
            "geojson": mapping(simplified),
        }
        try:
            safe_execute(supabase.table(APPELLATION_TABLE).upsert([payload], on_conflict="slug"))
            return
        except Exception as err:  # noqa: BLE001
            if not is_statement_timeout_error(err):
                raise

    # Last resort: keep centroid + metadata, and skip geometry payload for this row.
    safe_execute(
        supabase.table(APPELLATION_TABLE).upsert(
            [
                {
                    "slug": row["slug"],
                    "name_fr": row["name_fr"],
                    "name_en": row["name_en"],
                    "centroid_lat": row["centroid_lat"],
                    "centroid_lng": row["centroid_lng"],
                    "is_premium": row["is_premium"],
                    "status": row["status"],
                }
            ],
            on_conflict="slug",
        )
    )


def extract_geometry(raw_geojson):
    if not isinstance(raw_geojson, dict):
        return None
    if raw_geojson.get("type") == "Feature":
        return raw_geojson.get("geometry")
    return raw_geojson


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouve dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouves dans ./data/aoc: {shp_files}")
    return shp_files[0]


def build_dataset(shp_path: Path) -> pd.DataFrame:
    gdf = gpd.read_file(shp_path)
    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS defini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    gdf["denom_slug"] = gdf["denom"].astype(str).map(slugify)
    gdf = gdf[gdf["denom_slug"].isin(TARGET_AOP_TO_SUBREGION.keys())].copy()

    rows: list[dict] = []
    for slug, group in gdf.groupby("denom_slug", sort=True):
        merged_geom = group.geometry.union_all()
        if merged_geom is None or merged_geom.is_empty:
            continue
        centroid = merged_geom.centroid
        rows.append(
            {
                "slug": slug,
                "name_fr": DISPLAY_NAME_BY_SLUG[slug],
                "name_en": DISPLAY_NAME_BY_SLUG[slug],
                "geojson": mapping(merged_geom),
                "centroid_lat": float(centroid.y),
                "centroid_lng": float(centroid.x),
                "is_premium": True,
                "status": "draft",
                "target_subregion_slug": TARGET_AOP_TO_SUBREGION[slug],
            }
        )

    by_slug = {row["slug"]: row for row in rows}
    for target_slug, base_slug in FALLBACK_FROM_BASE.items():
        if target_slug in by_slug:
            continue
        if base_slug not in by_slug:
            continue
        base = by_slug[base_slug]
        rows.append(
            {
                **base,
                "slug": target_slug,
                "name_fr": DISPLAY_NAME_BY_SLUG[target_slug],
                "name_en": DISPLAY_NAME_BY_SLUG[target_slug],
                "target_subregion_slug": TARGET_AOP_TO_SUBREGION[target_slug],
            }
        )

    return pd.DataFrame(rows)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url:
        raise EnvironmentError("SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL manquante dans .env")
    if not service_key:
        raise EnvironmentError("SUPABASE_SERVICE_ROLE_KEY manquante dans .env")
    supabase = create_client(
        supabase_url,
        service_key,
        options=ClientOptions(postgrest_client_timeout=20),
    )

    dataset = build_dataset(get_shapefile_path(repo_root))
    if dataset.empty:
        raise RuntimeError("Aucune AOP Beaujolais trouvee dans le shapefile.")

    subregions = (
        safe_execute(
            supabase.table(SUBREGION_TABLE)
            .select("id,slug,geojson")
            .in_("slug", ["beaujolais", "beaujolais-villages", "beaujolais-crus"])
            .is_("deleted_at", None)
        )
        .data
        or []
    )
    subregion_id_by_slug = {row["slug"]: row["id"] for row in subregions}
    subregion_geom_by_slug = {}
    for row in subregions:
        geo = extract_geometry(row.get("geojson"))
        if not geo:
            continue
        try:
            subregion_geom_by_slug[row["slug"]] = shape(geo)
        except Exception:  # noqa: BLE001
            continue

    missing_subregions = {"beaujolais", "beaujolais-villages", "beaujolais-crus"} - set(
        subregion_id_by_slug.keys()
    )
    if missing_subregions:
        raise RuntimeError(f"Sous-regions introuvables: {sorted(missing_subregions)}")

    payload = dataset[
        [
            "slug",
            "name_fr",
            "name_en",
            "geojson",
            "centroid_lat",
            "centroid_lng",
            "is_premium",
            "status",
            "target_subregion_slug",
        ]
    ].to_dict(orient="records")
    for row in payload:
        upsert_appellation_resilient(supabase, row)
        time.sleep(0.35)

    app_slugs = dataset["slug"].drop_duplicates().tolist()
    app_rows = []
    for chunk in chunked(app_slugs, CHUNK_SIZE):
        app_rows.extend(
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .select("id,slug,centroid_lat,centroid_lng")
                .in_("slug", chunk)
                .is_("deleted_at", None)
            )
            .data
            or []
        )
    app_id_by_slug = {row["slug"]: row["id"] for row in app_rows}

    links = []
    for row in dataset.itertuples(index=False):
        app_id = app_id_by_slug.get(row.slug)
        subregion_id = subregion_id_by_slug.get(row.target_subregion_slug)
        if app_id and subregion_id:
            links.append({"appellation_id": app_id, "subregion_id": subregion_id})

    app_ids = sorted({link["appellation_id"] for link in links})
    for chunk in chunked(app_ids, CHUNK_SIZE):
        safe_execute(supabase.table(LINK_TABLE).delete().in_("appellation_id", chunk))
    for row in links:
        safe_execute(supabase.table(LINK_TABLE).insert([row]))
        time.sleep(0.25)

    repositioned = 0
    app_row_by_slug = {row["slug"]: row for row in app_rows}
    for row in dataset.itertuples(index=False):
        app = app_row_by_slug.get(row.slug)
        geom = subregion_geom_by_slug.get(row.target_subregion_slug)
        if app is None or geom is None or geom.is_empty:
            continue
        lat = app.get("centroid_lat")
        lng = app.get("centroid_lng")
        inside = False
        if lat is not None and lng is not None:
            inside = geom.covers(Point(float(lng), float(lat)))
        if inside:
            continue
        p = geom.representative_point()
        safe_execute(
            supabase.table(APPELLATION_TABLE)
            .update({"centroid_lat": float(p.y), "centroid_lng": float(p.x)})
            .eq("id", app["id"])
        )
        repositioned += 1

    counts = (
        pd.DataFrame(links)
        .merge(
            pd.DataFrame([{"subregion_id": v, "subregion_slug": k} for k, v in subregion_id_by_slug.items()]),
            on="subregion_id",
            how="left",
        )["subregion_slug"]
        .value_counts()
        .to_dict()
    )

    print(f"✓ {len(dataset)} AOP Beaujolais upserted")
    print(f"✓ {len(links)} liens crees dans {LINK_TABLE}")
    print(f"✓ Repartition: {counts}")
    print(f"✓ {repositioned} points AOP repositionnes a l'interieur de leur sous-region")


if __name__ == "__main__":
    main()
