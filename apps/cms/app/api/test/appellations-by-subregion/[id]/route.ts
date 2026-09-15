import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  const { data: subregion, error: subregionError } = await supabase
    .from("wine_subregions")
    .select("id, slug, name_fr, region_id, wine_regions!region_id(name_fr)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (subregionError) {
    return NextResponse.json({ error: subregionError.message }, { status: 500 });
  }

  const { data: links, error: linksError } = await supabase
    .from("appellation_subregion_links")
    .select("appellation_id")
    .eq("subregion_id", id);

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  const appellationIds = (links ?? [])
    .map((row) => (row as { appellation_id: string | null }).appellation_id)
    .filter((value): value is string => value != null);

  if (appellationIds.length === 0) {
    return NextResponse.json({ appellations: [] });
  }

  const { data: appellations, error: appellationsError } = await supabase
    .from("appellations")
    .select("id, name_fr, slug, centroid_lat, centroid_lng")
    .in("id", appellationIds)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });

  if (appellationsError) {
    return NextResponse.json({ error: appellationsError.message }, { status: 500 });
  }

  const rows = (appellations ?? [])
    .map((row) => ({
      id: row.id,
      name_fr: row.name_fr,
      slug: row.slug,
      centroid_lat: (row as { centroid_lat?: number | null }).centroid_lat ?? null,
      centroid_lng: (row as { centroid_lng?: number | null }).centroid_lng ?? null,
    }))
    .filter((row) => row.centroid_lat != null && row.centroid_lng != null);

  return NextResponse.json({
    appellations: rows,
  });
}
