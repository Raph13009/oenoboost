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
MAX_RETRIES = 8

TARGET_AOP_TO_SUBREGION = {
    # 1) Pays Nantais
    "muscadet": "pays-nantais",
    "muscadet-sevre-et-maine": "pays-nantais",
    "muscadet-coteaux-de-la-loire": "pays-nantais",
    "muscadet-cotes-de-grandlieu": "pays-nantais",
    "gros-plant-du-pays-nantais": "pays-nantais",
    "coteaux-d-ancenis": "pays-nantais",
    # 2) Anjou-Saumur
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
    # 3) Touraine
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
    # 4) Centre-Loire
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


def safe_execute(builder):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return builder.execute()
        except Exception as err:  # noqa: BLE001
            last_error = err
            if attempt == MAX_RETRIES:
                raise
            time.sleep(0.9 * attempt)
    raise RuntimeError(f"Echec execute apres retries: {last_error}")


def is_statement_timeout_error(err: Exception) -> bool:
    msg = str(err).lower()
    return "statement timeout" in msg or "57014" in msg


def upsert_appellation_resilient(supabase, row: dict) -> None:
    base_payload = {
        "slug": row["slug"],
        "name_fr": row["name_fr"],
        "name_en": row["name_en"],
        "geojson": row["geojson"],
        "centroid_lat": row["centroid_lat"],
        "centroid_lng": row["centroid_lng"],
        "is_premium": row["is_premium"],
        "status": row["status"],
    }
    try:
        safe_execute(supabase.table(APPELLATION_TABLE).upsert([base_payload], on_conflict="slug"))
        return
    except Exception as err:  # noqa: BLE001
        if not is_statement_timeout_error(err):
            raise

    geom = shape(extract_geometry(row["geojson"]))
    for tolerance in (0.0003, 0.0007, 0.0015, 0.003):
        simplified = geom.simplify(tolerance=tolerance, preserve_topology=True)
        if simplified.is_empty:
            continue
        payload = {**base_payload, "geojson": mapping(simplified)}
        try:
            safe_execute(supabase.table(APPELLATION_TABLE).upsert([payload], on_conflict="slug"))
            return
        except Exception as err:  # noqa: BLE001
            if not is_statement_timeout_error(err):
                raise

    # Last resort: keep AOP point and metadata if geometry still times out.
    safe_execute(
        supabase.table(APPELLATION_TABLE).upsert(
            [
                {
                    "slug": row["slug"],
                    "name_fr": row["name_fr"],
                    "name_en": row["name_en"],
                    "centroid_lat": row["centroid_lat"],
                    "centroid_lng": row["centroid_lng"],
                    "is_premium": row["is_premium"],
                    "status": row["status"],
                }
            ],
            on_conflict="slug",
        )
    )


def extract_geometry(raw_geojson):
    if not isinstance(raw_geojson, dict):
        return None
    if raw_geojson.get("type") == "Feature":
        return raw_geojson.get("geometry")
    return raw_geojson


def get_shapefile_path(repo_root: Path) -> Path:
    shp_files = sorted((repo_root / "data" / "aoc").glob("*.shp"))
    if not shp_files:
        raise FileNotFoundError("Aucun shapefile .shp trouve dans ./data/aoc")
    if len(shp_files) > 1:
        raise ValueError(f"Plusieurs shapefiles trouves dans ./data/aoc: {shp_files}")
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

    supabase = create_client(
        supabase_url,
        service_key,
        options=ClientOptions(postgrest_client_timeout=20),
    )

    subregion_id_by_slug = {}
    for slug in ["pays-nantais", "anjou-saumur", "touraine", "centre-loire"]:
        row = (
            safe_execute(
                supabase.table(SUBREGION_TABLE)
                .select("id")
                .eq("slug", slug)
                .is_("deleted_at", None)
                .limit(1)
            ).data
            or [None]
        )[0]
        if row is not None:
            subregion_id_by_slug[slug] = row["id"]
        time.sleep(0.15)
    subregion_geom_by_slug = {}
    for slug, subregion_id in subregion_id_by_slug.items():
        row = (
            safe_execute(
                supabase.table(SUBREGION_TABLE)
                .select("geojson")
                .eq("id", subregion_id)
                .limit(1)
            ).data
            or [None]
        )[0]
        if row is None:
            continue
        geo = extract_geometry(row.get("geojson"))
        if not geo:
            continue
        try:
            subregion_geom_by_slug[slug] = shape(geo)
        except Exception:  # noqa: BLE001
            continue
        time.sleep(0.15)

    missing_subregions = {"pays-nantais", "anjou-saumur", "touraine", "centre-loire"} - set(
        subregion_id_by_slug.keys()
    )
    if missing_subregions:
        raise RuntimeError(f"Sous-regions introuvables: {sorted(missing_subregions)}")

    gdf = gpd.read_file(get_shapefile_path(repo_root))
    if gdf.crs is None:
        raise ValueError("Le shapefile n'a pas de CRS defini.")
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")
    gdf = gdf[gdf.geometry.notnull() & ~gdf.geometry.is_empty].copy()
    # Normalize invalid geometries to avoid union topology exceptions.
    gdf["geometry"] = gdf["geometry"].map(lambda geom: make_valid(geom) if geom is not None else geom)
    gdf["denom_slug"] = gdf["denom"].astype(str).map(slugify)

    geometries_by_slug = {}
    for denom_slug, group in gdf.groupby("denom_slug", sort=True):
        try:
            merged = group.geometry.union_all()
        except Exception:  # noqa: BLE001
            merged = group.geometry.buffer(0).union_all()
        if merged is None or merged.is_empty:
            continue
        geometries_by_slug[denom_slug] = merged

    target_rows = []
    for target_slug, subregion_slug in TARGET_AOP_TO_SUBREGION.items():
        source_slug = SOURCE_DENOM_BY_TARGET.get(target_slug, target_slug)
        geom = geometries_by_slug.get(source_slug)
        if geom is None or geom.is_empty:
            raise RuntimeError(
                f"Geometrie introuvable dans shapefile pour '{target_slug}' (source '{source_slug}')"
            )
        centroid = geom.centroid
        target_rows.append(
            {
                "slug": target_slug,
                "name_fr": DISPLAY_NAME_BY_SLUG[target_slug],
                "name_en": DISPLAY_NAME_BY_SLUG[target_slug],
                "geojson": mapping(geom),
                "centroid_lat": float(centroid.y),
                "centroid_lng": float(centroid.x),
                "is_premium": True,
                "status": "draft",
                "target_subregion_slug": subregion_slug,
            }
        )

    upserted = 0
    linked = 0
    repositioned = 0

    for row in sorted(target_rows, key=lambda r: r["slug"]):
        upsert_appellation_resilient(supabase, row)
        upserted += 1
        time.sleep(0.45)

        app_row = (
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .select("id,slug,centroid_lat,centroid_lng")
                .eq("slug", row["slug"])
                .is_("deleted_at", None)
                .limit(1)
            ).data
            or [None]
        )[0]
        if not app_row:
            continue

        safe_execute(supabase.table(LINK_TABLE).delete().eq("appellation_id", app_row["id"]))
        time.sleep(0.2)
        safe_execute(
            supabase.table(LINK_TABLE).insert(
                [
                    {
                        "appellation_id": app_row["id"],
                        "subregion_id": subregion_id_by_slug[row["target_subregion_slug"]],
                    }
                ]
            )
        )
        linked += 1
        time.sleep(0.35)

        sub_geom = subregion_geom_by_slug.get(row["target_subregion_slug"])
        lat = app_row.get("centroid_lat")
        lng = app_row.get("centroid_lng")
        inside = False
        if sub_geom is not None and not sub_geom.is_empty and lat is not None and lng is not None:
            inside = sub_geom.covers(Point(float(lng), float(lat)))
        if not inside and sub_geom is not None and not sub_geom.is_empty:
            rp = sub_geom.representative_point()
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .update({"centroid_lat": float(rp.y), "centroid_lng": float(rp.x)})
                .eq("id", app_row["id"])
            )
            repositioned += 1
            time.sleep(0.25)

    # Final verification
    app_by_slug = {}
    link_subregion_by_app_id = {}
    for row in target_rows:
        slug = row["slug"]
        app = (
            safe_execute(
                supabase.table(APPELLATION_TABLE)
                .select("id,slug,name_fr,centroid_lat,centroid_lng,geojson")
                .eq("slug", slug)
                .is_("deleted_at", None)
                .limit(1)
            ).data
            or [None]
        )[0]
        if app is None:
            continue
        app_by_slug[slug] = app
        link = (
            safe_execute(
                supabase.table(LINK_TABLE)
                .select("appellation_id,subregion_id")
                .eq("appellation_id", app["id"])
                .limit(1)
            ).data
            or [None]
        )[0]
        if link is not None:
            link_subregion_by_app_id[app["id"]] = link["subregion_id"]
        time.sleep(0.15)
    subregion_slug_by_id = {v: k for k, v in subregion_id_by_slug.items()}

    issues = []
    for row in target_rows:
        app = app_by_slug.get(row["slug"])
        if app is None:
            issues.append((row["slug"], "missing_app"))
            continue
        linked_subregion_id = link_subregion_by_app_id.get(app["id"])
        if linked_subregion_id is None:
            issues.append((row["slug"], "missing_link"))
            continue
        linked_subregion_slug = subregion_slug_by_id.get(linked_subregion_id)
        if linked_subregion_slug != row["target_subregion_slug"]:
            issues.append((row["slug"], f"wrong_link:{linked_subregion_slug}"))
            continue
        geom = subregion_geom_by_slug.get(linked_subregion_slug)
        lat = app.get("centroid_lat")
        lng = app.get("centroid_lng")
        if (
            geom is None
            or geom.is_empty
            or lat is None
            or lng is None
            or not geom.covers(Point(float(lng), float(lat)))
        ):
            issues.append((row["slug"], "outside_subregion"))

    from collections import Counter

    repartition = Counter([row["target_subregion_slug"] for row in target_rows])
    print(f"✓ {upserted} AOP Loire upserted")
    print(f"✓ {linked} liens crees dans {LINK_TABLE}")
    print(f"✓ Repartition: {dict(repartition)}")
    print(f"✓ {repositioned} points AOP repositionnes")
    print(f"✓ Issues: {issues}")


if __name__ == "__main__":
    main()
