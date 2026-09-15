import os
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
from dotenv import load_dotenv
from supabase import create_client


REGION_TABLE = "wine_regions"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"
APPELLATION_TABLE = "appellations"
REGION_NAME = "Bordeaux"
TARGET_SUBREGION_SLUGS = {
    "blaye-bourg",
    "entre-deux-mers",
    "graves-sauternais",
    "libournais-rive-droite",
}


EXPLICIT_ALIASES = {
    "moulis-en-medoc": {"moulis-ou-moulis-en-medoc"},
    "cotes-de-bourg": {"cotes-de-bourg-bourg-et-bourgeais"},
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
        raise FileNotFoundError("Aucun shapefile .shp trouve dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouves dans ./data/aoc: {shp_files}")
    return shp_files[0]


def aliases_for_slug(slug: str) -> set[str]:
    aliases = {slug}
    aliases.update(EXPLICIT_ALIASES.get(slug, set()))

    if slug.endswith("-cotes-de-bordeaux"):
        prefix = slug[: -len("-cotes-de-bordeaux")]
        aliases.add(f"cotes-de-bordeaux-{prefix}")
    if slug.endswith("-bordeaux"):
        prefix = slug[: -len("-bordeaux")]
        aliases.add(f"cotes-de-bordeaux-{prefix}")

    if slug == "blaye":
        aliases.add("cotes-de-bordeaux-blaye")
    if slug == "sainte-foy-bordeaux":
        aliases.add("cotes-de-bordeaux-sainte-foy")

    return aliases


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

    region_rows = (
        supabase.table(REGION_TABLE).select("id").eq("name_fr", REGION_NAME).limit(1).execute().data or []
    )
    if not region_rows:
        raise RuntimeError(f"Region '{REGION_NAME}' introuvable.")
    region_id = region_rows[0]["id"]

    subregions = (
        supabase.table(SUBREGION_TABLE)
        .select("id,slug")
        .eq("region_id", region_id)
        .is_("deleted_at", None)
        .execute()
        .data
        or []
    )
    scoped_subregions = [row for row in subregions if row.get("slug") in TARGET_SUBREGION_SLUGS]
    subregion_ids = [row["id"] for row in scoped_subregions]
    if not subregion_ids:
        print("✓ 0 appellations Bordeaux mises a jour (aucune subregion cible)")
        return

    links: list[dict] = []
    for idx in range(0, len(subregion_ids), 200):
        chunk = subregion_ids[idx : idx + 200]
        links.extend(
            supabase.table(LINK_TABLE)
            .select("appellation_id")
            .in_("subregion_id", chunk)
            .execute()
            .data
            or []
        )
    appellation_ids = sorted({row["appellation_id"] for row in links if row.get("appellation_id")})
    if not appellation_ids:
        print("✓ 0 appellations Bordeaux mises a jour (aucun lien)")
        return

    appellations: list[dict] = []
    for idx in range(0, len(appellation_ids), 200):
        chunk = appellation_ids[idx : idx + 200]
        appellations.extend(
            supabase.table(APPELLATION_TABLE)
            .select("id,slug,name_fr")
            .in_("id", chunk)
            .is_("deleted_at", None)
            .execute()
            .data
            or []
        )

    shp_path = get_shapefile_path(repo_root)
    gdf = gpd.read_file(shp_path)
    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS defini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    gdf["app_slug"] = gdf["app"].astype(str).map(slugify)
    gdf["denom_slug"] = gdf["denom"].astype(str).map(slugify)

    updated = 0
    unresolved: list[str] = []

    for row in appellations:
        slug = row["slug"]
        aliases = aliases_for_slug(slug)
        subset = gdf[gdf["app_slug"].isin(aliases) | gdf["denom_slug"].isin(aliases)]
        if subset.empty:
            unresolved.append(slug)
            continue

        merged_geom = subset.geometry.union_all()
        if merged_geom is None or merged_geom.is_empty:
            unresolved.append(slug)
            continue

        centroid = merged_geom.centroid
        payload = {"centroid_lat": float(centroid.y), "centroid_lng": float(centroid.x)}
        supabase.table(APPELLATION_TABLE).update(payload).eq("id", row["id"]).execute()
        updated += 1

    print(
        "✓ "
        f"{updated} appellations mises a jour (Bordeaux: blaye-bourg, entre-deux-mers, graves-sauternais, libournais-rive-droite)"
    )
    if unresolved:
        print(f"⚠ {len(unresolved)} appellations sans geometrie source: {sorted(unresolved)}")


if __name__ == "__main__":
    main()
