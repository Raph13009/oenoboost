import os
import re
import time
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from shapely.geometry import mapping
from supabase import create_client


APPELLATION_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"
TARGET_SUBREGION_SLUGS = {"bugey", "vin-de-savoie"}
CHUNK_SIZE = 100
MAX_RETRIES = 5


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


def normalize_text(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"\s+", " ", value)
    return value


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouve dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouves dans ./data/aoc: {shp_files}")
    return shp_files[0]


def map_app_to_target_subregion(app_name: str) -> str | None:
    app_norm = normalize_text(app_name)
    if app_norm in {"bugey", "roussette du bugey"}:
        return "bugey"
    if app_norm in {"vin de savoie ou savoie", "roussette de savoie", "seyssel"}:
        return "vin-de-savoie"
    return None


def build_savoie_appellations_dataframe(shp_path: Path) -> pd.DataFrame:
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
    gdf["target_subregion_slug"] = gdf["app"].astype(str).map(map_app_to_target_subregion)
    gdf = gdf[gdf["target_subregion_slug"].notnull()].copy()

    if gdf.empty:
        return pd.DataFrame()

    gdf["name_fr"] = gdf["denom"].astype(str).str.strip()
    gdf["slug"] = gdf["name_fr"].map(slugify)

    aggregated_rows: list[dict] = []
    for slug, group in gdf.groupby("slug", sort=True):
        merged_geom = group.geometry.union_all()
        if merged_geom is None or merged_geom.is_empty:
            continue
        centroid = merged_geom.centroid
        name_fr = group["name_fr"].iloc[0]
        target_subregion_slug = group["target_subregion_slug"].mode().iloc[0]
        aggregated_rows.append(
            {
                "slug": slug,
                "name_fr": name_fr,
                "name_en": name_fr,
                "geojson": mapping(merged_geom),
                "centroid_lat": float(centroid.y),
                "centroid_lng": float(centroid.x),
                "is_premium": True,
                "status": "draft",
                "target_subregion_slug": target_subregion_slug,
            }
        )

    return pd.DataFrame(aggregated_rows)


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
    shp_path = get_shapefile_path(repo_root)
    appellations_df = build_savoie_appellations_dataframe(shp_path)
    if appellations_df.empty:
        raise RuntimeError("Aucune appellation Savoie/Bugey trouvee dans le shapefile.")

    subregions = (
        safe_execute(
            supabase.table(SUBREGION_TABLE)
            .select("id,slug")
            .in_("slug", list(TARGET_SUBREGION_SLUGS))
            .is_("deleted_at", None)
        ).data
        or []
    )
    subregion_id_by_slug = {row["slug"]: row["id"] for row in subregions}
    missing_subregions = TARGET_SUBREGION_SLUGS - set(subregion_id_by_slug.keys())
    if missing_subregions:
        raise RuntimeError(f"Sous-regions introuvables: {sorted(missing_subregions)}")

    upsert_payload = appellations_df[
        ["slug", "name_fr", "name_en", "geojson", "centroid_lat", "centroid_lng", "is_premium", "status"]
    ].to_dict(orient="records")

    for row in upsert_payload:
        safe_execute(supabase.table(APPELLATION_TABLE).upsert([row], on_conflict="slug"))

    app_slugs = appellations_df["slug"].drop_duplicates().tolist()
    app_rows: list[dict] = []
    for chunk in chunked(app_slugs, CHUNK_SIZE):
        app_rows.extend(
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .select("id,slug")
                .in_("slug", chunk)
                .is_("deleted_at", None)
            )
            .data
            or []
        )

    app_id_by_slug = {row["slug"]: row["id"] for row in app_rows}
    link_rows = []
    for _, row in appellations_df.iterrows():
        appellation_id = app_id_by_slug.get(row["slug"])
        subregion_id = subregion_id_by_slug.get(row["target_subregion_slug"])
        if appellation_id and subregion_id:
            link_rows.append({"appellation_id": appellation_id, "subregion_id": subregion_id})

    unique_appellation_ids = sorted({row["appellation_id"] for row in link_rows})
    for chunk in chunked(unique_appellation_ids, CHUNK_SIZE):
        safe_execute(supabase.table(LINK_TABLE).delete().in_("appellation_id", chunk))

    for row in link_rows:
        safe_execute(supabase.table(LINK_TABLE).insert([row]))

    counts = (
        pd.DataFrame(link_rows)
        .merge(
            pd.DataFrame(
                [{"subregion_id": v, "subregion_slug": k} for k, v in subregion_id_by_slug.items()]
            ),
            on="subregion_id",
            how="left",
        )["subregion_slug"]
        .value_counts()
        .to_dict()
    )

    print(f"✓ {len(appellations_df)} appellations Savoie upserted")
    print(f"✓ {len(link_rows)} liens appellation_subregion_links crees")
    print(f"✓ Repartition: {counts}")


if __name__ == "__main__":
    main()
