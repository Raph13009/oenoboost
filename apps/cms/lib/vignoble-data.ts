import { getSupabaseAdmin } from "@/lib/supabase";
import { listAppellationsForSubregion } from "@/lib/appellation-subregion-mapping";

export type RegionLite = {
  id: string;
  slug: string;
  name_fr: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
};

export type SubregionLite = {
  id: string;
  region_id: string;
  slug: string;
  name_fr: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
};

export type AppellationLite = {
  id: string;
  slug: string;
  name_fr: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
};

export async function getVignobleRegions(): Promise<RegionLite[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("id, slug, name_fr, centroid_lat, centroid_lng")
    .is("deleted_at", null)
    .not("centroid_lat", "is", null)
    .not("centroid_lng", "is", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegionLite[];
}

export async function getRegionBySlug(regionSlug: string): Promise<RegionLite | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("id, slug, name_fr, centroid_lat, centroid_lng")
    .eq("slug", regionSlug)
    .is("deleted_at", null)
    .single();
  if (error || !data) return null;
  return data as RegionLite;
}

export async function getSubregionBySlug(
  regionId: string,
  subregionSlug: string
): Promise<SubregionLite | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_subregions")
    .select("id, region_id, slug, name_fr, centroid_lat, centroid_lng")
    .eq("region_id", regionId)
    .eq("slug", subregionSlug)
    .is("deleted_at", null)
    .single();
  if (error || !data) return null;
  return data as SubregionLite;
}

export async function getSubregionsForRegion(regionId: string): Promise<SubregionLite[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_subregions")
    .select("id, region_id, slug, name_fr, centroid_lat, centroid_lng")
    .eq("region_id", regionId)
    .is("deleted_at", null)
    .not("centroid_lat", "is", null)
    .not("centroid_lng", "is", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SubregionLite[];
}

export async function getAppellationsForSubregion(subregion: {
  id: string;
  slug: string;
  name_fr: string;
  region_id: string;
  region_name_fr?: string | null;
}): Promise<AppellationLite[]> {
  const supabase = getSupabaseAdmin();

  // Current DB may not expose appellations.subregion_id in all environments.
  // We reuse existing subregion-appellation mapping logic to keep the route functional.
  const { data, error } = await supabase
    .from("appellations")
    .select("id, slug, name_fr, centroid_lat, centroid_lng")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AppellationLite[];
  const matched = listAppellationsForSubregion(subregion, rows);
  return matched.filter((row) => row.centroid_lat != null && row.centroid_lng != null);
}

export async function getAppellationBySlug(aopSlug: string): Promise<AppellationLite | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("appellations")
    .select("id, slug, name_fr, centroid_lat, centroid_lng")
    .eq("slug", aopSlug)
    .is("deleted_at", null)
    .single();
  if (error || !data) return null;
  return data as AppellationLite;
}
