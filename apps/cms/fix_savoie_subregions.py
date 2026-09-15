import json
import os
import re
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client


REGION_NAME = "Savoie"
REGION_TABLE = "wine_regions"
SUBREGION_TABLE = "wine_subregions"
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


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouvé dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouvés dans ./data/aoc: {shp_files}")
    return shp_files[0]


def load_savoie_dgc(shp_path: Path) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(shp_path)
    required_columns = {"app", "denom", "id_denom", "type_denom", "crinao", "geometry"}
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
    region_mask = (
        gdf["app"].astype(str).map(normalize_text).str.contains(region_norm, regex=False)
        | gdf["denom"].astype(str).map(normalize_text).str.contains(region_norm, regex=False)
    )

    dgc_gdf = gdf.loc[dgc_mask & region_mask].copy()
    dgc_gdf = dgc_gdf.dropna(subset=["id_denom", "denom"])
    dgc_gdf = dgc_gdf[dgc_gdf.geometry.notnull() & ~dgc_gdf.geometry.is_empty]
    dgc_gdf["id_denom"] = dgc_gdf["id_denom"].astype(str).str.strip()
    dgc_gdf["denom"] = dgc_gdf["denom"].astype(str).str.strip()
    dgc_gdf["crinao"] = dgc_gdf["crinao"].astype("string").str.strip()
    dgc_gdf = make_geometries_valid(dgc_gdf)
    return dgc_gdf


def build_subregion_updates(dgc_gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    name_df = (
        dgc_gdf[["id_denom", "crinao", "denom"]]
        .drop_duplicates()
        .assign(
            display_name=lambda df: df["crinao"].where(df["crinao"].notna() & (df["crinao"] != ""), df["denom"])
        )
        .loc[:, ["id_denom", "display_name"]]
        .drop_duplicates(subset=["id_denom"])
    )

    dissolved = dgc_gdf.dissolve(by="id_denom", as_index=False)
    dissolved = make_geometries_valid(dissolved)

    try:
        geojson_geoms = dissolved.geometry.__geo_interface__["geometries"]
    except Exception:
        geojson_geoms = dissolved.geometry.map(lambda geom: geom.__geo_interface__)

    geojson_df = pd.DataFrame(
        {
            "id_denom": dissolved["id_denom"].astype(str),
            "geojson": [json.loads(json.dumps(geom)) for geom in geojson_geoms],
        }
    )

    return name_df.merge(geojson_df, on="id_denom", how="inner").assign(
        name_fr=lambda df: df["display_name"],
        name_en=lambda df: df["display_name"],
        slug=lambda df: df["display_name"].map(slugify),
    )


def get_savoie_subregions(supabase) -> pd.DataFrame:
    region_res = (
        supabase.table(REGION_TABLE)
        .select("id")
        .eq("name_fr", REGION_NAME)
        .limit(1)
        .execute()
    )
    region_rows = get_response_data(region_res) or []
    if not region_rows:
        raise RuntimeError("Région Savoie introuvable dans wine_regions.")

    region_id = region_rows[0]["id"]
    subregions_res = (
        supabase.table(SUBREGION_TABLE)
        .select("id,slug,name_fr,region_id")
        .eq("region_id", region_id)
        .execute()
    )
    subregions_df = pd.DataFrame(get_response_data(subregions_res) or [])
    if subregions_df.empty:
        raise RuntimeError("Aucune subregion Savoie trouvée dans wine_subregions.")

    return subregions_df.assign(id_denom=lambda df: df["slug"].astype(str))


def bulk_update_subregions(supabase, updates_df: pd.DataFrame) -> None:
    payload = updates_df[["id", "region_id", "name_fr", "name_en", "slug", "geojson"]].to_dict(
        orient="records"
    )
    for chunk in chunked(payload, CHUNK_SIZE):
        supabase.table(SUBREGION_TABLE).upsert(chunk, on_conflict="id").execute()


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

    dgc_gdf = load_savoie_dgc(get_shapefile_path(repo_root))
    shapefile_updates_df = build_subregion_updates(dgc_gdf)
    db_subregions_df = get_savoie_subregions(supabase)

    updates_df = db_subregions_df.merge(
        shapefile_updates_df,
        on="id_denom",
        how="inner",
        suffixes=("_db", ""),
    )
    if updates_df.empty:
        raise RuntimeError("Aucune correspondance trouvée entre les subregions DB et le shapefile.")

    bulk_update_subregions(supabase, updates_df)

    print("✓ noms corrigés")
    print("✓ geojson ajoutés")


if __name__ == "__main__":
    main()
