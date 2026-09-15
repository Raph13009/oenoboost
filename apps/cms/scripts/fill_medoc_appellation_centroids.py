import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


APPELLATION_TABLE = "appellations"
CHUNK_SIZE = 50

# Approximate centroids for quick map markers (Medoc test scope only).
MEDOC_CENTROIDS = {
    "medoc": (45.315, -0.854),
    "haut-medoc": (45.195, -0.781),
    "listrac-medoc": (45.074, -0.799),
    "margaux": (45.039, -0.666),
    "moulis-en-medoc": (45.057, -0.769),
    "pauillac": (45.201, -0.749),
    "saint-estephe": (45.263, -0.771),
    "saint-julien": (45.138, -0.742),
}


def chunked(seq, chunk_size: int):
    for idx in range(0, len(seq), chunk_size):
        yield seq[idx : idx + chunk_size]


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
    slugs = list(MEDOC_CENTROIDS.keys())
    response = (
        supabase.table(APPELLATION_TABLE)
        .select("id,slug,name_fr,is_premium,status,centroid_lat,centroid_lng")
        .in_("slug", slugs)
        .is_("deleted_at", None)
        .execute()
    )
    rows = getattr(response, "data", None) or []

    updates = []
    for row in rows:
        slug = row.get("slug")
        if slug not in MEDOC_CENTROIDS:
            continue
        lat, lng = MEDOC_CENTROIDS[slug]
        updates.append(
            {
                "id": row["id"],
                "slug": row["slug"],
                "name_fr": row.get("name_fr") or "",
                "is_premium": bool(row.get("is_premium", True)),
                "status": row.get("status") or "draft",
                "centroid_lat": lat,
                "centroid_lng": lng,
            }
        )

    if not updates:
        print("✓ 0 appellations Medoc mises a jour")
        return

    for update in updates:
        (
            supabase.table(APPELLATION_TABLE)
            .update(
                {
                    "centroid_lat": update["centroid_lat"],
                    "centroid_lng": update["centroid_lng"],
                }
            )
            .eq("id", update["id"])
            .execute()
        )

    print(f"✓ {len(updates)} appellations Medoc mises a jour")


if __name__ == "__main__":
    main()
