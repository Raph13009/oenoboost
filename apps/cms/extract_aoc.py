import json
from pathlib import Path

import geopandas as gpd
import pandas as pd


# Change this after inspecting the printed columns.
NAME_COLUMN = "app"


def main() -> None:
    repo_root = Path(__file__).resolve().parent
    aoc_dir = repo_root / "data" / "aoc"
    out_path = repo_root / "appellations_raw.json"

    shp_files = sorted(aoc_dir.glob("*.shp"))
    if len(shp_files) == 0:
        raise FileNotFoundError(f"Aucun fichier .shp trouvé dans {aoc_dir}")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs fichiers .shp trouvés dans {aoc_dir}: {shp_files}")
    shp_path = shp_files[0]

    # 1) Une seule lecture du shapefile
    gdf = gpd.read_file(shp_path)

    # 2) Colonnes disponibles + 5 premières lignes sans la géométrie
    cols = list(gdf.columns)
    print("Colonnes disponibles:", cols)
    preview_df = gdf.drop(columns="geometry", errors="ignore").head(5)
    print(preview_df.to_string(index=False))

    # 3) Reprojection en WGS84 (EPSG:4326)
    epsg = None
    if gdf.crs is not None:
        try:
            epsg = gdf.crs.to_epsg()
        except Exception:
            epsg = None
    if epsg != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    if NAME_COLUMN not in gdf.columns:
        raise KeyError(
            f"NAME_COLUMN='{NAME_COLUMN}' introuvable. Colonnes: {list(gdf.columns)}"
        )

    # 4) Dissolve par la colonne d'appellation (1 ligne = 1 appellation)
    gdf = gdf.dropna(subset=[NAME_COLUMN])
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty]

    # Valider les géométries avant union/dissolve (évite TopologyException)
    # Shapely >=2: make_valid; sinon fallback buffer(0).
    try:
        from shapely import make_valid  # type: ignore

        gdf["geometry"] = make_valid(gdf.geometry)
    except Exception:
        gdf["geometry"] = gdf.geometry.buffer(0)

    dissolved = gdf.dissolve(by=NAME_COLUMN)
    dissolved = dissolved.reset_index()

    # 5) Centroid -> centroid_lat / centroid_lng
    # On calcule le centroid dans un CRS projeté (plus fiable), puis on repasse en WGS84.
    try:
        utm_crs = dissolved.estimate_utm_crs()
        centroids_proj = dissolved.to_crs(utm_crs).geometry.centroid
        centroids_wgs84 = centroids_proj.to_crs("EPSG:4326")
    except Exception:
        centroids_wgs84 = dissolved.geometry.centroid
    centroid_lng = centroids_wgs84.x
    centroid_lat = centroids_wgs84.y

    # 6) Sérialisation GeoJSON via __geo_interface__
    try:
        # Selon les versions GeoPandas/Shapely, la clé peut varier.
        geojson_geoms = dissolved.geometry.__geo_interface__["geometries"]
    except Exception:
        geojson_geoms = dissolved.geometry.map(lambda geom: geom.__geo_interface__)

    # 7) Construction liste de dicts (clés exactes)
    out_df = pd.DataFrame(
        {
            "name_fr": dissolved[NAME_COLUMN],
            "geojson": geojson_geoms,
            "centroid_lat": centroid_lat,
            "centroid_lng": centroid_lng,
        }
    )
    # Garantit des types JSON-compatibles.
    out_df["name_fr"] = out_df["name_fr"].astype(str)
    out_df["centroid_lat"] = out_df["centroid_lat"].astype(float)
    out_df["centroid_lng"] = out_df["centroid_lng"].astype(float)
    records = out_df.to_dict(orient="records")

    # 8) Export JSON (sans afficher le JSON dans le terminal)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)

    # 9) Message final uniquement
    print(f"✓ {len(records)} appellations exportées → appellations_raw.json")


if __name__ == "__main__":
    main()

