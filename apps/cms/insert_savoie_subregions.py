import os
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client


REGION_NAME = "Savoie"
SUBREGION_TABLE = "wine_subregions"
REGION_TABLE = "wine_regions"
APPELLATION_TABLE = "appellations"
CHUNK_SIZE = 100


def get_response_data(response):
    data = getattr(response, "data", None)
    if data is None and hasattr(response, "get"):
        data = response.get("data")  # type: ignore[union-attr]
    return data


def chunked(seq, chunk_size: int):
    for idx in range(0, len(seq), chunk_size):
        yield seq[idx : idx + chunk_size]


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


def normalize_text(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch
        for ch in unicodedata.normalize("NFD", value)
        if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"\s+", " ", value)
    return value


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouvé dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouvés dans ./data/aoc: {shp_files}")
    return shp_files[0]


def make_geometries_valid(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    try:
        from shapely import make_valid  # type: ignore

        gdf = gdf.copy()
        gdf["geometry"] = make_valid(gdf.geometry)
        return gdf
    except Exception:
        gdf = gdf.copy()
        gdf["geometry"] = gdf.geometry.buffer(0)
        return gdf


def load_dgc_gdf(shp_path: Path) -> tuple[gpd.GeoDataFrame, pd.DataFrame]:
    gdf = gpd.read_file(shp_path)
    required_columns = {"app", "denom", "id_denom", "type_denom", "geometry"}
    missing = required_columns - set(gdf.columns)
    if missing:
        raise KeyError(f"Colonnes shapefile manquantes: {sorted(missing)}")

    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS défini.")

    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    type_norm = (
        gdf["type_denom"]
        .astype(str)
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("ascii")
        .str.lower()
    )
    dgc_mask = type_norm.str.contains("dgc|denomination geographique complementaire", regex=True)
    region_norm = normalize_text(REGION_NAME)
    savoy_mask = (
        gdf["app"].astype(str).map(normalize_text).str.contains(region_norm, regex=False)
        | gdf.get("denom", pd.Series(index=gdf.index, dtype="object"))
        .astype(str)
        .map(normalize_text)
        .str.contains(region_norm, regex=False)
    )

    dgc_gdf = gdf.loc[dgc_mask & savoy_mask].copy()
    dgc_gdf = dgc_gdf.dropna(subset=["denom", "id_denom"])
    dgc_gdf = dgc_gdf[dgc_gdf.geometry.notnull() & ~dgc_gdf.geometry.is_empty]
    dgc_gdf["id_denom"] = dgc_gdf["id_denom"].astype(str).str.strip()
    dgc_gdf["denom"] = dgc_gdf["denom"].astype(str).str.strip()
    dgc_gdf = make_geometries_valid(dgc_gdf)

    mapping_df = (
        dgc_gdf[["denom", "id_denom"]]
        .drop_duplicates()
        .assign(
            appellation_name=lambda df: df["denom"],
            appellation_key=lambda df: df["denom"].map(normalize_text),
            subregion_name=lambda df: df["id_denom"],
            subregion_slug=lambda df: df["id_denom"].map(slugify),
        )
        .drop(columns=["id_denom"])
    )

    return dgc_gdf, mapping_df


def build_subregions_dataframe(dgc_gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    dissolved = dgc_gdf.dissolve(by="id_denom", as_index=False)
    dissolved = make_geometries_valid(dissolved)

    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroids_proj = dissolved.to_crs(utm_crs).geometry.centroid
        centroids_wgs84 = centroids_proj.to_crs("EPSG:4326")
    except Exception:
        centroids_wgs84 = dissolved.geometry.centroid

    return pd.DataFrame(
        {
            "name_fr": dissolved["id_denom"].astype(str),
            "slug": dissolved["id_denom"].astype(str).map(slugify),
            "centroid_lat": centroids_wgs84.y.astype(float),
            "centroid_lng": centroids_wgs84.x.astype(float),
        }
    )


def get_region_id(supabase, region_name: str) -> str:
    response = (
        supabase.table(REGION_TABLE)
        .select("id,name_fr")
        .eq("name_fr", region_name)
        .limit(1)
        .execute()
    )
    data = get_response_data(response) or []
    if not data:
        raise RuntimeError(
            f"Région '{region_name}' introuvable dans {REGION_TABLE}. "
            "Crée-la avant de lancer cet import."
        )
    return str(data[0]["id"])


def upsert_subregions(supabase, subregions_df: pd.DataFrame, region_id: str) -> pd.DataFrame:
    payload_df = subregions_df.assign(region_id=region_id)
    payload_df = payload_df.assign(name_en=payload_df["name_fr"])
    payload = payload_df[
        ["region_id", "name_fr", "name_en", "slug", "centroid_lat", "centroid_lng"]
    ].to_dict(orient="records")

    for chunk in chunked(payload, CHUNK_SIZE):
        supabase.table(SUBREGION_TABLE).upsert(chunk, on_conflict="slug").execute()

    slug_list = payload_df["slug"].drop_duplicates().tolist()
    fetched_rows = []
    for chunk in chunked(slug_list, CHUNK_SIZE):
        response = (
            supabase.table(SUBREGION_TABLE)
            .select("id,slug")
            .in_("slug", chunk)
            .execute()
        )
        fetched_rows.extend(get_response_data(response) or [])

    return pd.DataFrame(fetched_rows)


def fetch_appellations_by_names(supabase, appellation_names: list[str]) -> pd.DataFrame:
    fetched_rows = []
    for chunk in chunked(sorted(set(appellation_names)), CHUNK_SIZE):
        response = (
            supabase.table(APPELLATION_TABLE)
            .select("id,name_fr,subregion_id")
            .in_("name_fr", chunk)
            .execute()
        )
        fetched_rows.extend(get_response_data(response) or [])

    appellations_df = pd.DataFrame(fetched_rows)
    if appellations_df.empty:
        return appellations_df

    return appellations_df.assign(
        appellation_key=lambda df: df["name_fr"].astype(str).map(normalize_text)
    )


def bulk_link_appellations(supabase, mapping_df: pd.DataFrame, subregion_ids_df: pd.DataFrame) -> int:
    appellations_df = fetch_appellations_by_names(
        supabase,
        mapping_df["appellation_name"].drop_duplicates().tolist(),
    )

    if appellations_df.empty:
        return 0

    updates_df = (
        appellations_df.merge(mapping_df, on="appellation_key", how="inner")
        .merge(subregion_ids_df.rename(columns={"id": "subregion_id_new"}), on="slug", how="inner")
        .loc[:, ["id", "subregion_id", "subregion_id_new"]]
        .drop_duplicates(subset=["id", "subregion_id_new"])
    )

    ambiguous_ids = (
        updates_df.groupby("id")["subregion_id_new"].nunique().loc[lambda s: s > 1].index.tolist()
    )
    if ambiguous_ids:
        updates_df = updates_df[~updates_df["id"].isin(ambiguous_ids)]

    updates_df = updates_df[updates_df["subregion_id"] != updates_df["subregion_id_new"]]
    if updates_df.empty:
        return 0

    payload = (
        updates_df.rename(columns={"subregion_id_new": "subregion_id"})[["id", "subregion_id"]]
        .to_dict(orient="records")
    )
    for chunk in chunked(payload, CHUNK_SIZE):
        supabase.table(APPELLATION_TABLE).upsert(chunk, on_conflict="id").execute()

    return len(payload)


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

    shp_path = get_shapefile_path(repo_root)
    dgc_gdf, mapping_df = load_dgc_gdf(shp_path)
    subregions_df = build_subregions_dataframe(dgc_gdf)
    region_id = get_region_id(supabase, REGION_NAME)
    subregion_ids_df = upsert_subregions(supabase, subregions_df, region_id)

    if subregion_ids_df.empty:
        raise RuntimeError("Aucune subregion récupérée après upsert.")

    subregion_ids_df = subregion_ids_df.rename(columns={"slug": "subregion_slug"})
    linked_count = bulk_link_appellations(
        supabase,
        mapping_df.rename(columns={"subregion_slug": "slug"}),
        subregion_ids_df.rename(columns={"subregion_slug": "slug"}),
    )

    print(f"✓ {len(subregions_df)} subregions créées")
    print(f"✓ {linked_count} appellations liées aux subregions")


if __name__ == "__main__":
    main()
