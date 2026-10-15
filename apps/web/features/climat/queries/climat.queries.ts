import { createClient } from "@/lib/supabase/server";
import type {
  ClimateMapFeatureCollection,
  ClimateType,
  RelatedClimateGrape,
  RelatedClimateRegion,
} from "../types";

const CLIMATE_COLUMNS =
  "id, slug, name_fr, name_en, color_hex, definition_fr, definition_en, characteristics_fr, characteristics_en, temperature_amplitude_fr, temperature_amplitude_en, rainfall_fr, rainfall_en, sunshine_fr, sunshine_en, frost_hail_risk_fr, frost_hail_risk_en, vine_wine_impact_fr, vine_wine_impact_en, carousel_order, is_premium, status, published_at, created_at, updated_at, deleted_at";

export async function getPublishedClimates(): Promise<ClimateType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("climate_types")
    .select(CLIMATE_COLUMNS)
    .is("deleted_at", null)
    .eq("status", "published")
    .order("carousel_order", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch climates: ${error.message}`);
  }

  return (data ?? []) as ClimateType[];
}

export async function getClimateBySlug(
  slug: string,
): Promise<ClimateType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("climate_types")
    .select(CLIMATE_COLUMNS)
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch climate: ${error.message}`);
  }

  return (data ?? null) as ClimateType | null;
}

export async function getClimateMapGeojson(): Promise<ClimateMapFeatureCollection> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_climate_map_geojson");

  if (error) {
    throw new Error(`Failed to fetch climate map: ${error.message}`);
  }

  const fc = data as ClimateMapFeatureCollection | null;
  if (!fc || fc.type !== "FeatureCollection") {
    return { type: "FeatureCollection", features: [] };
  }
  return fc;
}

export async function getRelatedRegionsForClimate(
  climateId: string,
): Promise<RelatedClimateRegion[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("climate_wine_region_link")
    .select("region_id, is_primary")
    .eq("climate_id", climateId);

  if (linksError) {
    throw new Error(`Failed to fetch climate regions: ${linksError.message}`);
  }

  const rows = links ?? [];
  if (rows.length === 0) return [];

  const regionIds = rows.map((r) => r.region_id as string);
  const primaryByRegion = new Map(
    rows.map((r) => [r.region_id as string, Boolean(r.is_primary)]),
  );

  const { data: regions, error } = await supabase
    .from("wine_regions")
    .select("id, slug, name_fr, name_en")
    .in("id", regionIds)
    .is("deleted_at", null)
    .eq("status", "published")
    .order("name_fr", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch related regions: ${error.message}`);
  }

  return ((regions ?? []) as Array<{
    id: string;
    slug: string;
    name_fr: string;
    name_en: string;
  }>).map((r) => ({
    ...r,
    is_primary: primaryByRegion.get(r.id) ?? false,
  }));
}

export async function getRelatedGrapesForClimate(
  climateId: string,
): Promise<RelatedClimateGrape[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("climate_grape_link")
    .select("grape_id")
    .eq("climate_id", climateId);

  if (linksError) {
    throw new Error(`Failed to fetch climate grapes: ${linksError.message}`);
  }

  const grapeIds = (links ?? [])
    .map((l) => l.grape_id as string)
    .filter(Boolean);
  if (grapeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("grapes")
    .select("id, slug, name_fr, name_en, type")
    .in("id", grapeIds)
    .is("deleted_at", null)
    .eq("status", "published")
    .order("name_fr", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch related grapes: ${error.message}`);
  }

  return (data ?? []) as RelatedClimateGrape[];
}
