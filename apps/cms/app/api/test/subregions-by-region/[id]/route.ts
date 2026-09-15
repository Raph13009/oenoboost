import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUBREGION_COLORS = [
  "#2563eb",
  "#0f766e",
  "#b45309",
  "#be123c",
  "#7c3aed",
  "#15803d",
  "#c2410c",
  "#0369a1",
  "#4338ca",
  "#0d9488",
  "#ca8a04",
  "#dc2626",
];

function extractGeometry(value: unknown): GeoJSON.Geometry | null {
  if (value == null || typeof value !== "object") return null;

  const geo = value as {
    type?: string;
    geometry?: GeoJSON.Geometry;
  };

  if (
    geo.type === "Point" ||
    geo.type === "MultiPoint" ||
    geo.type === "LineString" ||
    geo.type === "MultiLineString" ||
    geo.type === "Polygon" ||
    geo.type === "MultiPolygon" ||
    geo.type === "GeometryCollection"
  ) {
    return geo as GeoJSON.Geometry;
  }

  if (geo.type === "Feature" && geo.geometry) {
    return geo.geometry;
  }

  return null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  const { data, error } = await supabase
    .from("wine_subregions")
    .select("id, slug, name_fr, centroid_lat, centroid_lng, geojson")
    .eq("region_id", id)
    .is("deleted_at", null)
    .not("centroid_lat", "is", null)
    .not("centroid_lng", "is", null)
    .not("geojson", "is", null)
    .order("name_fr", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    subregions: (data ?? [])
      .map((row, index) => {
        const geometry = extractGeometry(row.geojson);
        if (!geometry) return null;
        return {
          id: row.id,
          slug: row.slug,
          name_fr: row.name_fr,
          centroid_lat: row.centroid_lat,
          centroid_lng: row.centroid_lng,
          feature: {
            type: "Feature",
            properties: {
              id: row.id,
              slug: row.slug,
              name_fr: row.name_fr,
              centroid_lat: row.centroid_lat,
              centroid_lng: row.centroid_lng,
              color: SUBREGION_COLORS[index % SUBREGION_COLORS.length],
            },
            geometry,
          },
        };
      })
      .filter(Boolean),
  });
}
