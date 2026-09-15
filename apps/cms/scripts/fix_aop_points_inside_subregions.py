import os
from pathlib import Path

from dotenv import load_dotenv
from shapely.geometry import Point, shape
from supabase import create_client


APPELLATION_TABLE = "appellations"
SUBREGION_TABLE = "wine_subregions"
LINK_TABLE = "appellation_subregion_links"
CHUNK_SIZE = 200


def chunked(seq, size: int):
    for idx in range(0, len(seq), size):
        yield seq[idx : idx + size]


def extract_geometry(raw_geojson):
    if not isinstance(raw_geojson, dict):
        return None
    geo_type = raw_geojson.get("type")
    if geo_type == "Feature":
        return raw_geojson.get("geometry")
    return raw_geojson


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

    subregions = (
        supabase.table(SUBREGION_TABLE)
        .select("id,slug,name_fr,geojson,centroid_lat,centroid_lng")
        .is_("deleted_at", None)
        .not_.is_("geojson", None)
        .execute()
        .data
        or []
    )
    subregion_by_id = {}
    for subregion in subregions:
        geom_json = extract_geometry(subregion.get("geojson"))
        if not geom_json:
            continue
        try:
            subregion_geom = shape(geom_json)
        except Exception:  # noqa: BLE001
            continue
        if subregion_geom.is_empty:
            continue
        subregion_by_id[subregion["id"]] = {
            "slug": subregion["slug"],
            "name_fr": subregion["name_fr"],
            "geometry": subregion_geom,
            # representative_point is guaranteed to be inside the polygon
            "inside_lat": float(subregion_geom.representative_point().y),
            "inside_lng": float(subregion_geom.representative_point().x),
        }

    links = supabase.table(LINK_TABLE).select("appellation_id,subregion_id").execute().data or []
    if not links:
        print("✓ 0 AOP vérifiées (aucun lien)")
        return

    links = [link for link in links if link.get("subregion_id") in subregion_by_id]
    if not links:
        print("✓ 0 AOP vérifiées (aucune sous-région avec géométrie)")
        return

    app_ids = sorted({link["appellation_id"] for link in links if link.get("appellation_id")})
    appellations = []
    for ids_chunk in chunked(app_ids, CHUNK_SIZE):
        appellations.extend(
            supabase.table(APPELLATION_TABLE)
            .select("id,slug,name_fr,centroid_lat,centroid_lng")
            .in_("id", ids_chunk)
            .is_("deleted_at", None)
            .execute()
            .data
            or []
        )
    app_by_id = {app["id"]: app for app in appellations}

    checked_count = 0
    outside_count = 0
    updated_count = 0

    for link in links:
        app = app_by_id.get(link["appellation_id"])
        if not app:
            continue
        subregion = subregion_by_id[link["subregion_id"]]
        checked_count += 1

        lng = app.get("centroid_lng")
        lat = app.get("centroid_lat")
        is_inside = False
        if lng is not None and lat is not None:
            point = Point(float(lng), float(lat))
            is_inside = subregion["geometry"].covers(point)

        if is_inside:
            continue

        outside_count += 1
        payload = {
            "centroid_lat": subregion["inside_lat"],
            "centroid_lng": subregion["inside_lng"],
        }
        updated = (
            supabase.table(APPELLATION_TABLE)
            .update(payload)
            .eq("id", app["id"])
            .execute()
            .data
            or []
        )
        updated_count += len(updated)

    print(f"✓ {checked_count} AOP verifiees")
    print(f"✓ {outside_count} AOP detectees hors sous-region")
    print(f"✓ {updated_count} AOP repositionnees dans leur sous-region")


if __name__ == "__main__":
    main()
