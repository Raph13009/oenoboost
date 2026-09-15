import json
import os
import re
import subprocess
import sys
import unicodedata
from argparse import ArgumentParser
from pathlib import Path

import geopandas as gpd
from dotenv import dotenv_values, load_dotenv
from shapely.errors import GEOSException
from shapely.geometry import box
from supabase import create_client


CONFIG_DIR = Path("data/config")
CONFIG_TO_REGION_NAME = {
    "alsace_subregions": "Alsace",
    "beaujolais_subregions": "Beaujolais",
    "bordeaux_subregions": "Bordeaux",
    "bourgogne_subregions": "Bourgogne",
    "champagne_subregions": "Champagne",
    "corse_subregions": "Corse",
    "jura_subregions": "Jura",
    "languedoc_roussillon_subregions": "Languedoc-Roussillon",
    "loire_subregions_full": "Vallée de la Loire",
    "provence_subregions": "Provence",
    "savoie_subregions": "Savoie",
    "sud_ouest_subregions": "Sud-Ouest",
    "vallee_du_rhone_subregions": "Vallée du Rhône",
}
UNION_BATCH_SIZE = 100


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


def load_communes(repo_root: Path) -> gpd.GeoDataFrame:
    path = repo_root / "data" / "communes.geojson"
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        raise ValueError("communes.geojson has no CRS")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")
    gdf["dept_code"] = gdf["code"].astype(str).str.slice(0, 2)
    gdf["commune_id"] = gdf["code"].astype(str)
    gdf["geometry"] = gdf.geometry.map(make_valid)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty]
    return gdf


def list_region_configs(repo_root: Path) -> list[tuple[str, Path]]:
    config_paths = sorted((repo_root / CONFIG_DIR).glob("*.json"))
    items: list[tuple[str, Path]] = []
    for config_path in config_paths:
        region_name_fr = CONFIG_TO_REGION_NAME.get(config_path.stem)
        if region_name_fr is None:
            raise RuntimeError(f"No wine_regions mapping for config: {config_path.name}")
        items.append((region_name_fr, config_path))
    return items


def load_region_config(config_path: Path) -> dict:
    with config_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def get_region_id(supabase, region_name_fr: str) -> str:
    res = (
        supabase.table("wine_regions")
        .select("id")
        .eq("name_fr", region_name_fr)
        .limit(1)
        .execute()
    )
    rows = get_response_data(res) or []
    if not rows:
        raise RuntimeError(f"Region not found in wine_regions: {region_name_fr}")
    return str(rows[0]["id"])


def region_already_processed(supabase, region_id: str) -> bool:
    res = (
        supabase.table("wine_subregions")
        .select("id")
        .eq("region_id", region_id)
        .limit(1)
        .execute()
    )
    return len(get_response_data(res) or []) > 0


def slug_exists(supabase, slug: str) -> bool:
    res = (
        supabase.table("wine_subregions")
        .select("id")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    return len(get_response_data(res) or []) > 0


def make_valid(geometry):
    try:
        from shapely import make_valid as shapely_make_valid  # type: ignore

        return shapely_make_valid(geometry)
    except Exception:
        return geometry.buffer(0)


def union_in_chunks(geometries, chunk_size: int = UNION_BATCH_SIZE):
    current = [make_valid(geom) for geom in geometries if geom is not None and not geom.is_empty]
    if not current:
        raise RuntimeError("No valid geometries to merge.")

    while len(current) > 1:
        next_round = []
        for idx in range(0, len(current), chunk_size):
            chunk = current[idx : idx + chunk_size]
            try:
                merged = gpd.GeoSeries(chunk, crs="EPSG:4326").union_all()
            except GEOSException:
                half = max(1, len(chunk) // 2)
                if len(chunk) == 1:
                    merged = chunk[0]
                else:
                    left = union_in_chunks(chunk[:half], chunk_size=max(2, half))
                    right = union_in_chunks(chunk[half:], chunk_size=max(2, len(chunk) - half))
                    merged = gpd.GeoSeries([left, right], crs="EPSG:4326").union_all()
            next_round.append(make_valid(merged))
        current = next_round

    return make_valid(current[0])


def build_subregion_payload(
    communes_gdf: gpd.GeoDataFrame,
    region_id: str,
    subregion_name: str,
    rules: dict,
    used_commune_ids: set[str],
):
    dept_codes = rules["departements"]
    bbox_values = rules["bbox"]
    bbox_geom = box(*bbox_values)

    filtered = communes_gdf.loc[communes_gdf["dept_code"].isin(dept_codes)].copy()
    filtered = filtered[filtered.geometry.intersects(bbox_geom)]
    skipped_count = int(filtered["commune_id"].isin(used_commune_ids).sum())
    filtered = filtered[~filtered["commune_id"].isin(used_commune_ids)].copy()

    if filtered.empty:
        raise RuntimeError(f"No communes matched for subregion: {subregion_name}")

    merged = union_in_chunks(filtered.geometry.tolist())
    dissolved = gpd.GeoSeries([merged], crs="EPSG:4326")
    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroid = dissolved.to_crs(utm_crs).centroid.to_crs("EPSG:4326").iloc[0]
    except Exception:
        centroid = dissolved.centroid.iloc[0]

    assigned_ids = set(filtered["commune_id"].tolist())

    return (
        {
            "region_id": region_id,
            "slug": slugify(subregion_name),
            "name_fr": subregion_name,
            "name_en": subregion_name,
            "geojson": merged.__geo_interface__,
            "centroid_lat": float(centroid.y),
            "centroid_lng": float(centroid.x),
        },
        len(assigned_ids),
        skipped_count,
        assigned_ids,
    )


def truncate_wine_subregions(db_url: str | None, supabase) -> None:
    if db_url:
        subprocess.run(
            ["psql", db_url, "-c", "TRUNCATE TABLE wine_subregions RESTART IDENTITY;"],
            check=True,
            capture_output=True,
            text=True,
        )
        return

    supabase.table("wine_subregions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()


def process_region(
    supabase,
    communes_gdf: gpd.GeoDataFrame,
    region_name_fr: str,
    config_path: Path,
    used_commune_ids: set[str],
) -> tuple[bool, int]:
    region_id = get_region_id(supabase, region_name_fr)
    if region_already_processed(supabase, region_id):
        print(f"Skipping region: {region_name_fr} (already processed)")
        return False, 0

    config = load_region_config(config_path)
    inserted_count = 0

    print(f"Processing region: {region_name_fr}")
    for subregion_name, rules in config.items():
        slug = slugify(subregion_name)
        if slug_exists(supabase, slug):
            print(f"  Skipping subregion: {subregion_name} (slug exists)")
            continue

        try:
            print(f"  Building subregion: {subregion_name}")
            payload, assigned_count, skipped_count, assigned_ids = build_subregion_payload(
                communes_gdf,
                region_id,
                subregion_name,
                rules,
                used_commune_ids,
            )
            supabase.table("wine_subregions").insert([payload]).execute()
            used_commune_ids.update(assigned_ids)
            inserted_count += 1
            print(
                f"  Inserted subregion: {subregion_name} "
                f"(assigned: {assigned_count}, skipped-used: {skipped_count})"
            )
        except Exception as exc:
            print(f"  Error on subregion {subregion_name}: {exc}")
            continue

    print(f"Summary {region_name_fr}: {inserted_count} subregions inserted")
    return True, inserted_count


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("region", nargs="?", default=None)
    parser.add_argument("--truncate", action="store_true")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent
    load_dotenv(repo_root / ".env")
    env_values = dotenv_values(repo_root / ".env")

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_db_url = os.getenv("SUPABASE_DB_URL") or env_values.get("SUPABASE_DB_URL")
    if not supabase_url or not supabase_service_role_key:
        raise EnvironmentError("Missing Supabase credentials in .env")
    supabase = create_client(supabase_url, supabase_service_role_key)
    communes_gdf = load_communes(repo_root)
    region_configs = list_region_configs(repo_root)

    if args.truncate:
        print("Truncating wine_subregions...")
        truncate_wine_subregions(supabase_db_url, supabase)
        print("wine_subregions truncated")

    only_region = args.region
    if only_region:
        region_configs = [item for item in region_configs if item[0] == only_region]
        if not region_configs:
            raise RuntimeError(f"No config found for region: {only_region}")

    processed_regions = 0
    inserted_total = 0
    used_commune_ids: set[str] = set()

    for region_name_fr, config_path in region_configs:
        try:
            processed, inserted = process_region(
                supabase,
                communes_gdf,
                region_name_fr,
                config_path,
                used_commune_ids,
            )
            if processed:
                processed_regions += 1
            inserted_total += inserted
        except Exception as exc:
            print(f"Region failed: {region_name_fr} -> {exc}")
            continue

    print(f"✓ {processed_regions} regions processed")
    print(f"✓ {inserted_total} subregions inserted")


if __name__ == "__main__":
    main()
