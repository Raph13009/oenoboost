import os
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
from dotenv import load_dotenv
from shapely.geometry import mapping
from supabase import create_client


APPELLATION_TABLE = "appellations"
TARGET_SLUGS = [
    "medoc",
    "haut-medoc",
    "listrac-medoc",
    "margaux",
    "moulis-en-medoc",
    "pauillac",
    "saint-estephe",
    "saint-julien",
]
SHAPE_ALIASES = {
    "moulis-en-medoc": {"moulis-en-medoc", "moulis-ou-moulis-en-medoc"},
}


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    value = re.sub(r"-{2,}", "-", value)
    return value


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouvé dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouvés dans ./data/aoc: {shp_files}")
    return shp_files[0]


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
    rows = (
        supabase.table(APPELLATION_TABLE)
        .select("id,slug,name_fr")
        .in_("slug", TARGET_SLUGS)
        .is_("deleted_at", None)
        .execute()
        .data
        or []
    )
    if not rows:
        print("✓ 0 appellations Medoc mises a jour (aucune ligne trouvee)")
        return

    shp_path = get_shapefile_path(repo_root)
    gdf = gpd.read_file(shp_path)
    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS defini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    gdf["app_slug"] = gdf["app"].astype(str).map(slugify)

    updated = 0
    for row in rows:
        slug = row["slug"]
        aliases = SHAPE_ALIASES.get(slug, {slug})
        subset = gdf[gdf["app_slug"].isin(aliases)]
        if subset.empty:
            continue

        merged_geom = subset.geometry.union_all()
        if merged_geom is None or merged_geom.is_empty:
            continue

        centroid = merged_geom.centroid
        payload = {
            "geojson": mapping(merged_geom),
            "centroid_lat": float(centroid.y),
            "centroid_lng": float(centroid.x),
        }
        supabase.table(APPELLATION_TABLE).update(payload).eq("id", row["id"]).execute()
        updated += 1

    print(f"✓ {updated} appellations Medoc mises a jour (geojson + centroid)")


if __name__ == "__main__":
    main()
