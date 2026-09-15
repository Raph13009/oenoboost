import os
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from shapely.geometry import Point, mapping, shape
from supabase import create_client


APPELLATION_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"
CHUNK_SIZE = 100

TARGET_APP_TO_SUBREGION = {
    "arbois": "arbois",
    "cotes-du-jura": "cotes-du-jura",
    "chateau-chalon": "cotes-du-jura",
    "l-etoile": "cotes-du-jura",
    "cremant-du-jura": "cotes-du-jura",
    "macvin-du-jura": "cotes-du-jura",
}


def chunked(seq, chunk_size: int):
    for idx in range(0, len(seq), chunk_size):
        yield seq[idx : idx + chunk_size]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    value = re.sub(r"-{2,}", "-", value)
    return value


def normalize_text(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"\s+", " ", value)
    return value


def extract_geometry(raw_geojson):
    if not isinstance(raw_geojson, dict):
        return None
    geo_type = raw_geojson.get("type")
    if geo_type == "Feature":
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
    required_columns = {"app", "denom", "geometry"}
    missing = required_columns - set(gdf.columns)
    if missing:
        raise KeyError(f"Colonnes shapefile manquantes: {sorted(missing)}")

    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS defini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    gdf["app_key"] = gdf["app"].astype(str).map(slugify)
    gdf["target_subregion_slug"] = gdf["app_key"].map(TARGET_APP_TO_SUBREGION)
    gdf = gdf[gdf["target_subregion_slug"].notnull()].copy()
    if gdf.empty:
        return pd.DataFrame()

    gdf["name_fr"] = gdf["denom"].astype(str).str.strip()
    gdf["slug"] = gdf["name_fr"].map(slugify)

    rows: list[dict] = []
    for slug, group in gdf.groupby("slug", sort=True):
        merged_geom = group.geometry.union_all()
        if merged_geom is None or merged_geom.is_empty:
            continue
        centroid = merged_geom.centroid
        target_subregion_slug = group["target_subregion_slug"].mode().iloc[0]
        rows.append(
            {
                "slug": slug,
                "name_fr": group["name_fr"].iloc[0],
                "name_en": group["name_fr"].iloc[0],
                "geojson": mapping(merged_geom),
                "centroid_lat": float(centroid.y),
                "centroid_lng": float(centroid.x),
                "is_premium": True,
                "status": "draft",
                "target_subregion_slug": target_subregion_slug,
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

    supabase = create_client(supabase_url, service_key)
    dataset = build_dataset(get_shapefile_path(repo_root))
    if dataset.empty:
        raise RuntimeError(
            "Aucune AOP cible trouvee pour Arbois/Cotes du Jura/Chateau-Chalon/L'Etoile/Cremant/Macvin dans le shapefile."
        )

    subregions = (
        supabase.table(SUBREGION_TABLE)
        .select("id,slug,geojson")
        .in_("slug", list(set(TARGET_APP_TO_SUBREGION.values())))
        .is_("deleted_at", None)
        .execute()
        .data
        or []
    )
    subregion_id_by_slug = {row["slug"]: row["id"] for row in subregions}
    subregion_geom_by_slug = {}
    for row in subregions:
        geom_json = extract_geometry(row.get("geojson"))
        if not geom_json:
            continue
        try:
            subregion_geom_by_slug[row["slug"]] = shape(geom_json)
        except Exception:  # noqa: BLE001
            continue

    missing_subregions = set(TARGET_APP_TO_SUBREGION.values()) - set(subregion_id_by_slug.keys())
    if missing_subregions:
        raise RuntimeError(f"Sous-regions introuvables: {sorted(missing_subregions)}")

    payload = dataset[
        ["slug", "name_fr", "name_en", "geojson", "centroid_lat", "centroid_lng", "is_premium", "status"]
    ].to_dict(orient="records")
    for chunk in chunked(payload, CHUNK_SIZE):
        supabase.table(APPELLATION_TABLE).upsert(chunk, on_conflict="slug").execute()

    app_slugs = dataset["slug"].drop_duplicates().tolist()
    app_rows = []
    for chunk in chunked(app_slugs, CHUNK_SIZE):
        app_rows.extend(
            supabase.table(APPELLATION_TABLE)
            .select("id,slug,centroid_lat,centroid_lng")
            .in_("slug", chunk)
            .is_("deleted_at", None)
            .execute()
            .data
            or []
        )
    app_id_by_slug = {row["slug"]: row["id"] for row in app_rows}

    links = []
    for _, row in dataset.iterrows():
        app_id = app_id_by_slug.get(row["slug"])
        subregion_slug = row["target_subregion_slug"]
        subregion_id = subregion_id_by_slug.get(subregion_slug)
        if not app_id or not subregion_id:
            continue
        links.append({"appellation_id": app_id, "subregion_id": subregion_id})

    app_ids = sorted({link["appellation_id"] for link in links})
    for chunk in chunked(app_ids, CHUNK_SIZE):
        supabase.table(LINK_TABLE).delete().in_("appellation_id", chunk).execute()
    for chunk in chunked(links, CHUNK_SIZE):
        supabase.table(LINK_TABLE).insert(chunk).execute()

    # Ensure points are inside their subregion (visual coherence MVP).
    repositioned = 0
    for row in dataset.itertuples(index=False):
        app_slug = row.slug
        app_id = app_id_by_slug.get(app_slug)
        if not app_id:
            continue
        app_row = next((a for a in app_rows if a["slug"] == app_slug), None)
        if not app_row:
            continue

        subregion_slug = row.target_subregion_slug
        subregion_geom = subregion_geom_by_slug.get(subregion_slug)
        if subregion_geom is None or subregion_geom.is_empty:
            continue
        lat = app_row.get("centroid_lat")
        lng = app_row.get("centroid_lng")
        is_inside = False
        if lat is not None and lng is not None:
            is_inside = subregion_geom.covers(Point(float(lng), float(lat)))

        if is_inside:
            continue

        inside_point = subregion_geom.representative_point()
        supabase.table(APPELLATION_TABLE).update(
            {"centroid_lat": float(inside_point.y), "centroid_lng": float(inside_point.x)}
        ).eq("id", app_id).execute()
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

    print(
        "✓ "
        f"{len(dataset)} AOP Jura upserted (Arbois + Cotes du Jura + Chateau-Chalon + L'Etoile + Cremant + Macvin)"
    )
    print(f"✓ {len(links)} liens crees dans {LINK_TABLE}")
    print(f"✓ Repartition: {counts}")
    print(f"✓ {repositioned} points AOP repositionnes a l'interieur de leur sous-region")


if __name__ == "__main__":
    main()
