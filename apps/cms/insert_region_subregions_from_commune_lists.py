import json
import os
import re
import subprocess
import unicodedata
from argparse import ArgumentParser
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import dotenv_values, load_dotenv
from shapely.errors import GEOSException
from supabase import create_client


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


def normalize_name(value: str) -> str:
    return slugify(value)


def get_response_data(response):
    data = getattr(response, "data", None)
    if data is None and hasattr(response, "get"):
        data = response.get("data")  # type: ignore[union-attr]
    return data


def make_valid(geometry):
    try:
        from shapely import make_valid as shapely_make_valid  # type: ignore

        return shapely_make_valid(geometry)
    except Exception:
        return geometry.buffer(0)


def load_communes(repo_root: Path) -> gpd.GeoDataFrame:
    path = repo_root / "data" / "communes.geojson"
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        raise ValueError("communes.geojson has no CRS")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")
    gdf["commune_id"] = gdf["code"].astype(str)
    gdf["commune_name"] = gdf["nom"].astype(str)
    gdf["commune_name_norm"] = gdf["commune_name"].map(normalize_name)
    gdf["geometry"] = gdf.geometry.map(make_valid)
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    return gdf


def load_commune_mapping(repo_root: Path, config_path: Path) -> dict[str, list[str]]:
    path = repo_root / config_path
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise ValueError(f"Invalid mapping file: {path}")
    return {str(key): [str(item) for item in value] for key, value in payload.items()}


def parse_commune_entry(value: str) -> tuple[str | None, str]:
    raw = value.strip()
    match = re.match(r"^(\d{2})\s*:\s*(.+)$", raw)
    if match:
        return match.group(1), match.group(2).strip()
    return None, raw


def load_region_dept_codes(repo_root: Path, dept_config_path: Path) -> list[str]:
    path = repo_root / dept_config_path
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    dept_codes: set[str] = set()
    for rules in payload.values():
        dept_codes.update(str(code) for code in rules.get("departements", []))
    if not dept_codes:
        raise ValueError(f"No department codes found in {path}")
    return sorted(dept_codes)


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


def slug_exists(supabase, slug: str) -> bool:
    res = (
        supabase.table("wine_subregions")
        .select("id")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    return len(get_response_data(res) or []) > 0


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
    commune_names: list[str],
):
    requested_entries = [parse_commune_entry(name) for name in commune_names if name.strip()]
    if not requested_entries:
        raise RuntimeError(f"Subregion has no commune names configured: {subregion_name}")
    requested_keys = {
        f"{dept}:{normalize_name(name)}" if dept else normalize_name(name)
        for dept, name in requested_entries
    }
    if len(requested_keys) != len(requested_entries):
        raise RuntimeError(f"Duplicate commune names configured for subregion: {subregion_name}")

    pieces = []
    for dept, name in requested_entries:
        mask = communes_gdf["commune_name_norm"] == normalize_name(name)
        if dept:
            mask &= communes_gdf["commune_id"].str.slice(0, 2) == dept
        pieces.append(communes_gdf.loc[mask].copy())
    filtered = gpd.GeoDataFrame(
        pd.concat(pieces, ignore_index=True) if pieces else communes_gdf.iloc[0:0].copy(),
        crs=communes_gdf.crs,
    )

    if filtered.empty:
        raise RuntimeError(f"No communes matched for subregion: {subregion_name}")

    duplicate_matches = (
        filtered.assign(
            commune_match_key=
            filtered["commune_id"].str.slice(0, 2) + ":" + filtered["commune_name_norm"]
        )["commune_match_key"].value_counts()
    )
    ambiguous = duplicate_matches[duplicate_matches > 1]
    if not ambiguous.empty:
        ambiguous_names = sorted(
            filtered.loc[
                (
                    filtered["commune_id"].str.slice(0, 2)
                    + ":"
                    + filtered["commune_name_norm"]
                ).isin(ambiguous.index),
                "commune_name",
            ].drop_duplicates().tolist()
        )
        raise RuntimeError(
            f"Ambiguous commune names for subregion {subregion_name}: {', '.join(ambiguous_names)}"
        )

    missing_names = []
    for dept, name in requested_entries:
        mask = filtered["commune_name_norm"] == normalize_name(name)
        if dept:
            mask &= filtered["commune_id"].str.slice(0, 2) == dept
        if not mask.any():
            missing_names.append(f"{dept}:{name}" if dept else name)
    if missing_names:
        raise RuntimeError(
            f"Missing communes for subregion {subregion_name}: {', '.join(missing_names)}"
        )

    merged = union_in_chunks(filtered.geometry.tolist())
    dissolved = gpd.GeoSeries([merged], crs="EPSG:4326")
    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroid = dissolved.to_crs(utm_crs).centroid.to_crs("EPSG:4326").iloc[0]
    except Exception:
        centroid = dissolved.centroid.iloc[0]

    payload = {
        "region_id": region_id,
        "slug": slugify(subregion_name),
        "name_fr": subregion_name,
        "name_en": subregion_name,
        "geojson": merged.__geo_interface__,
        "centroid_lat": float(centroid.y),
        "centroid_lng": float(centroid.x),
    }
    return payload, len(filtered), missing_names


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


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--truncate", action="store_true")
    parser.add_argument(
        "--region-name",
        required=True,
        help="wine_regions.name_fr value to target, for example 'Bordeaux'",
    )
    parser.add_argument(
        "--config",
        required=True,
        help="Relative path to the explicit commune-list JSON mapping",
    )
    parser.add_argument(
        "--dept-config",
        required=True,
        help="Relative path to the region config JSON used only to derive allowed departments",
    )
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
    dept_codes = load_region_dept_codes(repo_root, Path(args.dept_config))
    communes_gdf = communes_gdf.loc[communes_gdf["commune_id"].str.slice(0, 2).isin(dept_codes)].copy()
    region_id = get_region_id(supabase, args.region_name)
    mapping = load_commune_mapping(repo_root, Path(args.config))

    if args.truncate:
        print("Truncating wine_subregions...")
        truncate_wine_subregions(supabase_db_url, supabase)
        print("wine_subregions truncated")

    inserted_count = 0
    print(f"Processing region: {args.region_name}")
    for subregion_name, commune_names in mapping.items():
        slug = slugify(subregion_name)
        if slug_exists(supabase, slug):
            print(f"  Skipping subregion: {subregion_name} (slug exists)")
            continue

        print(f"  Building subregion: {subregion_name}")
        payload, assigned_count, missing_names = build_subregion_payload(
            communes_gdf,
            region_id,
            subregion_name,
            commune_names,
        )
        supabase.table("wine_subregions").insert([payload]).execute()
        inserted_count += 1
        print(f"  Inserted subregion: {subregion_name} (assigned: {assigned_count})")

    print(f"Summary {args.region_name}: {inserted_count} subregions inserted")


if __name__ == "__main__":
    main()
