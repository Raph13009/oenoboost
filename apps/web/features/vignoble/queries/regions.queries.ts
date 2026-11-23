import { createClient } from "@/lib/supabase/server";
import type { WineRegion } from "../types";

/** Full map payload (includes GeoJSON). Prefer `getRegionNavMeta` on home. */
export async function getRegions(): Promise<WineRegion[]> {
  const supabase = await createClient();

  const query = supabase
    .from("wine_regions")
    .select(
      "id, slug, name_fr, name_en, color_hex, department_count, area_hectares, total_production_hl, main_grapes_fr, main_grapes_en, map_order, status, published_at, geojson, centroid_lat, centroid_lng",
    )
    .is("deleted_at", null);

  const { data, error } = await query.order("map_order", {
    ascending: true,
  });

  if (error) throw new Error(`Failed to fetch regions: ${error.message}`);
  return (data ?? []) as WineRegion[];
}


export type RegionNavMeta = Pick<
  WineRegion,
  "id" | "slug" | "name_fr" | "name_en" | "status" | "map_order"
>;

/** Slim region list for nav / home showcase (no GeoJSON). */
export async function getRegionNavMeta(): Promise<RegionNavMeta[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wine_regions")
    .select("id, slug, name_fr, name_en, status, map_order")
    .is("deleted_at", null)
    .order("map_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch region nav meta: ${error.message}`);
  }
  return (data ?? []) as RegionNavMeta[];
}

export async function getRegionBySlug(
  slug: string,
): Promise<WineRegion | null> {
  const supabase = await createClient();

  const query = supabase
    .from("wine_regions")
    .select(
      "id, slug, name_fr, name_en, department_count, area_hectares, total_production_hl, main_grapes_fr, main_grapes_en, color_hex, map_order, status, created_at, updated_at, deleted_at, centroid_lat, centroid_lng, geojson, published_at",
    )
    .eq("slug", slug)
    .is("deleted_at", null);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch region: ${error.message}`);
  }
  return data as WineRegion;
}
