import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client
from supabase.lib.client_options import ClientOptions


REGION_TABLE = "wine_regions"
SUBREGION_TABLE = "wine_subregions"
CHUNK_SIZE = 100
MAX_RETRIES = 4
MAX_TIMEOUT_SPLITS = 4

APP_TO_REGION = {
    "Aloxe-Corton": "Bourgogne",
    "Alsace ou Vin d'Alsace": "Alsace",
    "Arbois": "Jura",
    "Auxey-Duresses": "Bourgogne",
    "Beaujolais": "Beaujolais",
    "Beaune": "Bourgogne",
    "Blagny": "Bourgogne",
    "Bordeaux": "Bordeaux",
    "Bourgogne": "Bourgogne",
    "Bugey": "Bugey",
    "Chablis": "Bourgogne",
    "Chablis Grand Cru": "Bourgogne",
    "Chambolle-Musigny": "Bourgogne",
    "Chassagne-Montrachet": "Bourgogne",
    "Chorey-lès-Beaune": "Bourgogne",
    "Clairette du Languedoc": "Languedoc-Roussillon",
    "Corton": "Bourgogne",
    "Coteaux du Layon": "Vallée de la Loire",
    "Côtes d'Auvergne": "Auvergne",
    "Côtes de Bordeaux": "Bordeaux",
    "Côtes de Provence": "Provence",
    "Côtes du Rhône Villages": "Vallée du Rhône",
    "Côtes du Roussillon Villages": "Languedoc-Roussillon",
    "Entre-deux-Mers": "Bordeaux",
    "Fixin": "Bourgogne",
    "Gevrey-Chambertin": "Bourgogne",
    "Givry": "Bourgogne",
    "Ladoix": "Bourgogne",
    "Languedoc": "Languedoc-Roussillon",
    "Maranges": "Bourgogne",
    "Marsannay": "Bourgogne",
    "Mercurey": "Bourgogne",
    "Meursault": "Bourgogne",
    "Montagny": "Bourgogne",
    "Monthélie": "Bourgogne",
    "Morey-Saint-Denis": "Bourgogne",
    "Muscadet Sèvre et Maine": "Vallée de la Loire",
    "Mâcon": "Bourgogne",
    "Nuits-Saint-Georges": "Bourgogne",
    "Pernand-Vergelesses": "Bourgogne",
    "Pommard": "Bourgogne",
    "Pouilly-Fuissé": "Bourgogne",
    "Pouilly-Loché": "Bourgogne",
    "Pouilly-Vinzelles": "Bourgogne",
    "Puligny-Montrachet": "Bourgogne",
    "Roussette de Savoie": "Savoie",
    "Roussette du Bugey": "Bugey",
    "Rully": "Bourgogne",
    "Saint-Aubin": "Bourgogne",
    "Saint-Chinian": "Languedoc-Roussillon",
    "Saint-Romain": "Bourgogne",
    "Santenay": "Bourgogne",
    "Saumur": "Vallée de la Loire",
    "Savigny-lès-Beaune": "Bourgogne",
    "Touraine": "Vallée de la Loire",
    "Vin de Corse ou Corse": "Corse",
    "Vin de Savoie ou Savoie": "Savoie",
    "Viré-Clessé": "Bourgogne",
    "Volnay": "Bourgogne",
    "Vosne-Romanée": "Bourgogne",
    "Vougeot": "Bourgogne",
}

REGION_ALIASES = {
    "Loire": "Vallée de la Loire",
    "Rhône": "Vallée du Rhône",
}

REGION_SHAPEFILE_ALIASES = {
    "Champagne": ["Champagne", "Champagne-Ardenne"],
    "Vallée de la Loire": ["Vallée de la Loire", "Loire"],
    "Vallée du Rhône": ["Vallée du Rhône", "Rhône"],
}

FALLBACK_AOP_APPS = {
    "Champagne": {
        "Champagne",
        "Coteaux champenois",
        "Rosé des Riceys",
    },
    "Sud-Ouest": {
        "Bergerac",
        "Brulhois",
        "Buzet",
        "Cahors",
        "Côtes de Bergerac",
        "Côtes de Duras",
        "Côtes de Montravel",
        "Fronton",
        "Gaillac",
        "Gaillac premières côtes",
        "Haut-Montravel",
        "Jurançon",
        "Madiran",
        "Marcillac",
        "Monbazillac",
        "Montravel",
        "Pacherenc du Vic-Bilh",
        "Saint-Mont",
        "Tursan",
    },
}


def get_response_data(response):
    data = getattr(response, "data", None)
    if data is None and hasattr(response, "get"):
        data = response.get("data")  # type: ignore[union-attr]
    return data


def execute_with_retry(builder):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return builder.execute()
        except Exception:
            if attempt == MAX_RETRIES:
                raise
            time.sleep(attempt * 2)


def is_statement_timeout_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "statement timeout" in message or "57014" in message


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


def load_region_dgc_gdf(shp_path: Path, region_name: str) -> gpd.GeoDataFrame:
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
    dgc_gdf = gdf.loc[type_norm.str.contains("dgc|denomination geographique complementaire", regex=True)].copy()
    dgc_gdf = dgc_gdf.dropna(subset=["app", "denom", "id_denom"])
    dgc_gdf = dgc_gdf[dgc_gdf.geometry.notnull() & ~dgc_gdf.geometry.is_empty]
    dgc_gdf["app"] = dgc_gdf["app"].astype(str).str.strip()
    dgc_gdf["denom"] = dgc_gdf["denom"].astype(str).str.strip()
    dgc_gdf["id_denom"] = dgc_gdf["id_denom"].astype(str).str.strip()
    dgc_gdf["crinao"] = dgc_gdf["crinao"].astype("string").str.strip()
    dgc_gdf["region_name"] = dgc_gdf["app"].map(APP_TO_REGION)
    unknown_apps = sorted(dgc_gdf.loc[dgc_gdf["region_name"].isna(), "app"].drop_duplicates().tolist())
    if unknown_apps:
        raise RuntimeError(f"Apps DGC sans mapping de région: {unknown_apps}")

    candidate_names = REGION_SHAPEFILE_ALIASES.get(region_name, [region_name])
    region_gdf = dgc_gdf.loc[dgc_gdf["region_name"].isin(candidate_names)].copy()
    return make_geometries_valid(region_gdf)


def load_region_aop_gdf(shp_path: Path, region_name: str) -> gpd.GeoDataFrame:
    app_names = FALLBACK_AOP_APPS.get(region_name, set())
    if not app_names:
        return gpd.GeoDataFrame()

    gdf = gpd.read_file(shp_path)
    required_columns = {"app", "type_denom", "geometry"}
    missing = required_columns - set(gdf.columns)
    if missing:
        raise KeyError(f"Colonnes shapefile manquantes pour fallback AOP: {sorted(missing)}")

    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS défini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    aop_gdf = gdf.loc[gdf["type_denom"].astype(str).str.contains("appellation", case=False, na=False)].copy()
    aop_gdf["app"] = aop_gdf["app"].astype(str).str.strip()
    aop_gdf = aop_gdf.loc[aop_gdf["app"].isin(app_names)].copy()
    if aop_gdf.empty:
        return aop_gdf

    aop_gdf = aop_gdf[aop_gdf.geometry.notnull() & ~aop_gdf.geometry.is_empty]
    return make_geometries_valid(aop_gdf)


def build_subregions_df(region_gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    names_df = (
        region_gdf[["id_denom", "crinao", "denom"]]
        .drop_duplicates()
        .assign(
            name_fr=lambda df: df["crinao"].where(df["crinao"].notna() & (df["crinao"] != ""), df["denom"])
        )
        .loc[:, ["id_denom", "name_fr"]]
        .drop_duplicates(subset=["id_denom"])
    )

    dissolved = region_gdf.dissolve(by="id_denom", as_index=False)
    dissolved = make_geometries_valid(dissolved)

    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroids_proj = dissolved.to_crs(utm_crs).geometry.centroid
        centroids_wgs84 = centroids_proj.to_crs("EPSG:4326")
    except Exception:
        centroids_wgs84 = dissolved.geometry.centroid

    try:
        geojson_geoms = dissolved.geometry.__geo_interface__["geometries"]
    except Exception:
        geojson_geoms = dissolved.geometry.map(lambda geom: geom.__geo_interface__)

    geometry_df = pd.DataFrame(
        {
            "id_denom": dissolved["id_denom"].astype(str),
            "centroid_lat": centroids_wgs84.y.astype(float),
            "centroid_lng": centroids_wgs84.x.astype(float),
            "geojson": [json.loads(json.dumps(geom)) for geom in geojson_geoms],
        }
    )

    return names_df.merge(geometry_df, on="id_denom", how="inner").assign(
        name_en=lambda df: df["name_fr"],
        slug=lambda df: df["name_fr"].map(slugify),
    )


def build_subregions_from_aop_df(aop_gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    dissolved = aop_gdf.dissolve(by="app", as_index=False)
    dissolved = make_geometries_valid(dissolved)

    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroids_proj = dissolved.to_crs(utm_crs).geometry.centroid
        centroids_wgs84 = centroids_proj.to_crs("EPSG:4326")
    except Exception:
        centroids_wgs84 = dissolved.geometry.centroid

    try:
        geojson_geoms = dissolved.geometry.__geo_interface__["geometries"]
    except Exception:
        geojson_geoms = dissolved.geometry.map(lambda geom: geom.__geo_interface__)

    return pd.DataFrame(
        {
            "name_fr": dissolved["app"].astype(str),
            "name_en": dissolved["app"].astype(str),
            "slug": dissolved["app"].astype(str).map(slugify),
            "centroid_lat": centroids_wgs84.y.astype(float),
            "centroid_lng": centroids_wgs84.x.astype(float),
            "geojson": [json.loads(json.dumps(geom)) for geom in geojson_geoms],
        }
    )


def get_region_and_subregion_state(supabase, region_name: str) -> tuple[str, set[str]]:
    region_res = execute_with_retry(
        supabase.table(REGION_TABLE).select("id").eq("name_fr", region_name).limit(1)
    )
    region_rows = get_response_data(region_res) or []
    if not region_rows:
        raise RuntimeError(f"Région '{region_name}' introuvable dans wine_regions.")

    region_id = region_rows[0]["id"]
    subregions_res = execute_with_retry(
        supabase.table(SUBREGION_TABLE).select("slug").eq("region_id", region_id)
    )
    existing_rows = get_response_data(subregions_res) or []
    existing_slugs = {row["slug"] for row in existing_rows if row.get("slug")}
    return region_id, existing_slugs


def upsert_subregions(supabase, subregions_df: pd.DataFrame, region_id: str) -> None:
    payload = subregions_df.assign(region_id=region_id)[
        ["region_id", "name_fr", "name_en", "slug", "centroid_lat", "centroid_lng", "geojson"]
    ].to_dict(orient="records")

    def upsert_chunk(rows, depth: int) -> None:
        if not rows:
            return
        try:
            execute_with_retry(
                supabase.table(SUBREGION_TABLE).upsert(
                    rows, on_conflict="slug", returning="minimal"
                )
            )
        except Exception as exc:
            if not is_statement_timeout_error(exc) or depth >= MAX_TIMEOUT_SPLITS or len(rows) == 1:
                raise
            mid = len(rows) // 2
            upsert_chunk(rows[:mid], depth + 1)
            upsert_chunk(rows[mid:], depth + 1)

    for chunk in chunked(payload, CHUNK_SIZE):
        upsert_chunk(chunk, depth=0)


def insert_subregions_sequentially(supabase, subregions_df: pd.DataFrame, region_id: str) -> None:
    payload = subregions_df.assign(region_id=region_id)[
        ["region_id", "name_fr", "name_en", "slug", "centroid_lat", "centroid_lng", "geojson"]
    ].to_dict(orient="records")

    for row in payload:
        execute_with_retry(
            supabase.table(SUBREGION_TABLE).upsert(
                [row], on_conflict="slug", returning="minimal"
            )
        )
        time.sleep(0.5)


def main() -> None:
    region_name = sys.argv[1] if len(sys.argv) > 1 else "Savoie"
    region_name = REGION_ALIASES.get(region_name, region_name)

    repo_root = Path(__file__).resolve().parent
    load_dotenv(repo_root / ".env")

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url:
        raise EnvironmentError("SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL manquante dans .env")
    if not supabase_service_role_key:
        raise EnvironmentError("SUPABASE_SERVICE_ROLE_KEY manquante dans .env")

    supabase = create_client(
        supabase_url,
        supabase_service_role_key,
        options=ClientOptions(postgrest_client_timeout=300),
    )

    region_id, existing_slugs = get_region_and_subregion_state(supabase, region_name)

    shp_path = get_shapefile_path(repo_root)
    region_gdf = load_region_dgc_gdf(shp_path, region_name)
    if not region_gdf.empty:
        if existing_slugs:
            print(f"Skipping: {region_name} (already exists)")
            return
        subregions_df = build_subregions_df(region_gdf)
        upsert_subregions(supabase, subregions_df, region_id)
        print(f"✓ {len(subregions_df)} subregions créées pour {region_name}")
        return

    aop_gdf = load_region_aop_gdf(shp_path, region_name)
    if aop_gdf.empty:
        print(f"⚠️ Région {region_name} non trouvée dans shapefile → skip")
        print(f"Skipping: {region_name} (not found)")
        return

    subregions_df = build_subregions_from_aop_df(aop_gdf)
    if existing_slugs:
        subregions_df = subregions_df.loc[~subregions_df["slug"].isin(existing_slugs)].copy()
    if subregions_df.empty:
        print(f"Skipping: {region_name} (already exists)")
        return
    insert_subregions_sequentially(supabase, subregions_df, region_id)
    print(f"✓ {len(subregions_df)} subregions créées pour {region_name} (fallback AOP)")


if __name__ == "__main__":
    main()
