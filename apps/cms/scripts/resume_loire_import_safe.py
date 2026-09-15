import os
import re
import time
import unicodedata
from pathlib import Path

import geopandas as gpd
from dotenv import load_dotenv
from shapely import make_valid
from shapely.geometry import Point, mapping, shape
from supabase import ClientOptions, create_client


APPELLATION_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"

TARGET_AOP_TO_SUBREGION = {
    "muscadet": "pays-nantais",
    "muscadet-sevre-et-maine": "pays-nantais",
    "muscadet-coteaux-de-la-loire": "pays-nantais",
    "muscadet-cotes-de-grandlieu": "pays-nantais",
    "gros-plant-du-pays-nantais": "pays-nantais",
    "coteaux-d-ancenis": "pays-nantais",
    "anjou": "anjou-saumur",
    "anjou-villages": "anjou-saumur",
    "anjou-villages-brissac": "anjou-saumur",
    "anjou-coteaux-de-la-loire": "anjou-saumur",
    "savennieres": "anjou-saumur",
    "coteaux-du-layon": "anjou-saumur",
    "quarts-de-chaume-grand-cru": "anjou-saumur",
    "bonnezeaux": "anjou-saumur",
    "coteaux-de-l-aubance": "anjou-saumur",
    "saumur": "anjou-saumur",
    "saumur-champigny": "anjou-saumur",
    "cabernet-de-saumur": "anjou-saumur",
    "coteaux-de-saumur": "anjou-saumur",
    "cremant-de-loire": "anjou-saumur",
    "rose-de-loire": "anjou-saumur",
    "touraine": "touraine",
    "vouvray": "touraine",
    "montlouis-sur-loire": "touraine",
    "chinon": "touraine",
    "bourgueil": "touraine",
    "saint-nicolas-de-bourgueil": "touraine",
    "cheverny": "touraine",
    "cour-cheverny": "touraine",
    "coteaux-du-loir": "touraine",
    "jasnieres": "touraine",
    "coteaux-du-vendomois": "touraine",
    "valencay": "touraine",
    "sancerre": "centre-loire",
    "pouilly-fume": "centre-loire",
    "pouilly-sur-loire": "centre-loire",
    "menetou-salon": "centre-loire",
    "quincy": "centre-loire",
    "reuilly": "centre-loire",
    "chateaumeillant": "centre-loire",
}

SOURCE_DENOM_BY_TARGET = {
    "pouilly-fume": "pouilly-fume-ou-blanc-fume-de-pouilly",
    "quarts-de-chaume-grand-cru": "quarts-de-chaume",
    "anjou-villages-brissac": "anjou-villages",
    "cabernet-de-saumur": "saumur",
}

DISPLAY_NAME_BY_SLUG = {
    "muscadet": "Muscadet",
    "muscadet-sevre-et-maine": "Muscadet Sèvre-et-Maine",
    "muscadet-coteaux-de-la-loire": "Muscadet Coteaux de la Loire",
    "muscadet-cotes-de-grandlieu": "Muscadet Côtes de Grandlieu",
    "gros-plant-du-pays-nantais": "Gros Plant du Pays Nantais",
    "coteaux-d-ancenis": "Coteaux d'Ancenis",
    "anjou": "Anjou",
    "anjou-villages": "Anjou Villages",
    "anjou-villages-brissac": "Anjou Villages Brissac",
    "anjou-coteaux-de-la-loire": "Anjou-Coteaux de la Loire",
    "savennieres": "Savennières",
    "coteaux-du-layon": "Coteaux du Layon",
    "quarts-de-chaume-grand-cru": "Quarts de Chaume (Grand Cru)",
    "bonnezeaux": "Bonnezeaux",
    "coteaux-de-l-aubance": "Coteaux de l'Aubance",
    "saumur": "Saumur",
    "saumur-champigny": "Saumur-Champigny",
    "cabernet-de-saumur": "Cabernet de Saumur",
    "coteaux-de-saumur": "Coteaux de Saumur",
    "cremant-de-loire": "Crémant de Loire",
    "rose-de-loire": "Rosé de Loire",
    "touraine": "Touraine",
    "vouvray": "Vouvray",
    "montlouis-sur-loire": "Montlouis-sur-Loire",
    "chinon": "Chinon",
    "bourgueil": "Bourgueil",
    "saint-nicolas-de-bourgueil": "Saint-Nicolas-de-Bourgueil",
    "cheverny": "Cheverny",
    "cour-cheverny": "Cour-Cheverny",
    "coteaux-du-loir": "Coteaux du Loir",
    "jasnieres": "Jasnières",
    "coteaux-du-vendomois": "Coteaux du Vendômois",
    "valencay": "Valençay",
    "sancerre": "Sancerre",
    "pouilly-fume": "Pouilly-Fumé",
    "pouilly-sur-loire": "Pouilly-sur-Loire",
    "menetou-salon": "Menetou-Salon",
    "quincy": "Quincy",
    "reuilly": "Reuilly",
    "chateaumeillant": "Châteaumeillant",
}


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = "".join(
        ch for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch) != "Mn"
    )
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    value = re.sub(r"-{2,}", "-", value)
    return value


def safe_execute(builder, label: str, retries: int = 10):
    err = None
    for attempt in range(1, retries + 1):
        try:
            return builder.execute()
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(0.8 * attempt)
    raise RuntimeError(f"{label} failed: {err}")


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouve dans ./data/aoc")
    return shp_files[0]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise EnvironmentError("Variables Supabase manquantes")

    supabase = create_client(
        supabase_url,
        service_key,
        options=ClientOptions(postgrest_client_timeout=15),
    )

    # subregions
    subregion_id_by_slug = {}
    subregion_geom_by_slug = {}
    for slug in ["pays-nantais", "anjou-saumur", "touraine", "centre-loire"]:
        row = (
            safe_execute(
                supabase.table(SUBREGION_TABLE)
                .select("id,geojson")
                .eq("slug", slug)
                .is_("deleted_at", None)
                .limit(1),
                f"subregion {slug}",
            ).data
            or [None]
        )[0]
        if row is None:
            raise RuntimeError(f"Sous-region introuvable: {slug}")
        subregion_id_by_slug[slug] = row["id"]
        geo = row["geojson"]
        if isinstance(geo, dict) and geo.get("type") == "Feature":
            geo = geo.get("geometry")
        subregion_geom_by_slug[slug] = shape(geo)
        time.sleep(0.2)

    # source geometries
    gdf = gpd.read_file(get_shapefile_path(repo_root))
    if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    gdf["geometry"] = gdf["geometry"].map(lambda geom: make_valid(geom) if geom is not None else geom)
    gdf["denom_slug"] = gdf["denom"].astype(str).map(slugify)

    source_geoms = {}
    for denom_slug, group in gdf.groupby("denom_slug", sort=True):
        try:
            merged = group.geometry.union_all()
        except Exception:  # noqa: BLE001
            merged = group.geometry.buffer(0).union_all()
        if merged is None or merged.is_empty:
            continue
        source_geoms[denom_slug] = merged

    done = 0
    for target_slug, target_subregion_slug in TARGET_AOP_TO_SUBREGION.items():
        source_slug = SOURCE_DENOM_BY_TARGET.get(target_slug, target_slug)
        geom = source_geoms.get(source_slug)
        if geom is None or geom.is_empty:
            raise RuntimeError(f"Geometrie manquante pour {target_slug} (source {source_slug})")

        centroid = geom.centroid
        payload = {
            "slug": target_slug,
            "name_fr": DISPLAY_NAME_BY_SLUG[target_slug],
            "name_en": DISPLAY_NAME_BY_SLUG[target_slug],
            "geojson": mapping(geom),
            "centroid_lat": float(centroid.y),
            "centroid_lng": float(centroid.x),
            "is_premium": True,
            "status": "draft",
        }

        safe_execute(
            supabase.table(APPELLATION_TABLE).upsert([payload], on_conflict="slug"),
            f"upsert {target_slug}",
        )
        time.sleep(0.5)

        app = (
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .select("id,centroid_lat,centroid_lng")
                .eq("slug", target_slug)
                .is_("deleted_at", None)
                .limit(1),
                f"fetch {target_slug}",
            ).data
            or [None]
        )[0]
        if app is None:
            raise RuntimeError(f"Appellation introuvable apres upsert: {target_slug}")

        safe_execute(
            supabase.table(LINK_TABLE).delete().eq("appellation_id", app["id"]),
            f"clear link {target_slug}",
        )
        time.sleep(0.2)
        safe_execute(
            supabase.table(LINK_TABLE).insert(
                [
                    {
                        "appellation_id": app["id"],
                        "subregion_id": subregion_id_by_slug[target_subregion_slug],
                    }
                ]
            ),
            f"link {target_slug}",
        )
        time.sleep(0.35)

        # ensure point inside subregion
        sub_geom = subregion_geom_by_slug[target_subregion_slug]
        point = Point(float(app["centroid_lng"]), float(app["centroid_lat"]))
        if not sub_geom.covers(point):
            rp = sub_geom.representative_point()
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .update({"centroid_lat": float(rp.y), "centroid_lng": float(rp.x)})
                .eq("id", app["id"]),
                f"reposition {target_slug}",
            )
            time.sleep(0.25)

        done += 1
        print(f"ok {done}/40 {target_slug}")

    print("✓ Loire import terminé")


if __name__ == "__main__":
    main()
