"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ClimateType = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  color_hex: string | null;
  definition_fr: string | null;
  definition_en: string | null;
  characteristics_fr: string | null;
  characteristics_en: string | null;
  temperature_amplitude_fr: string | null;
  temperature_amplitude_en: string | null;
  rainfall_fr: string | null;
  rainfall_en: string | null;
  sunshine_fr: string | null;
  sunshine_en: string | null;
  frost_hail_risk_fr: string | null;
  frost_hail_risk_en: string | null;
  vine_wine_impact_fr: string | null;
  vine_wine_impact_en: string | null;
  carousel_order: number | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ClimateTypeListItem = Pick<
  ClimateType,
  "id" | "slug" | "name_fr" | "name_en" | "status" | "updated_at" | "color_hex"
>;

export type ClimateLinkedRegion = {
  id: string;
  name_fr: string;
  slug: string;
  is_primary: boolean;
};

export type ClimateLinkedGrape = {
  id: string;
  name_fr: string;
  slug: string;
};

const LIST_COLUMNS = "id,slug,name_fr,name_en,status,updated_at,color_hex";
const DETAIL_COLUMNS =
  "id,slug,name_fr,name_en,color_hex,definition_fr,definition_en,characteristics_fr,characteristics_en,temperature_amplitude_fr,temperature_amplitude_en,rainfall_fr,rainfall_en,sunshine_fr,sunshine_en,frost_hail_risk_fr,frost_hail_risk_en,vine_wine_impact_fr,vine_wine_impact_en,carousel_order,is_premium,status,published_at,created_at,updated_at,deleted_at";

export async function getClimateTypes(): Promise<ClimateTypeListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("climate_types")
    .select(LIST_COLUMNS)
    .is("deleted_at", null)
    .order("carousel_order", { ascending: true, nullsFirst: false })
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClimateTypeListItem[];
}

export async function getClimateType(id: string): Promise<ClimateType | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("climate_types")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as ClimateType;
}

type ClimateTypeForm = Omit<
  ClimateType,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

function formToRow(form: ClimateTypeForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || "",
    color_hex: form.color_hex || null,
    definition_fr: form.definition_fr || null,
    definition_en: form.definition_en || null,
    characteristics_fr: form.characteristics_fr || null,
    characteristics_en: form.characteristics_en || null,
    temperature_amplitude_fr: form.temperature_amplitude_fr || null,
    temperature_amplitude_en: form.temperature_amplitude_en || null,
    rainfall_fr: form.rainfall_fr || null,
    rainfall_en: form.rainfall_en || null,
    sunshine_fr: form.sunshine_fr || null,
    sunshine_en: form.sunshine_en || null,
    frost_hail_risk_fr: form.frost_hail_risk_fr || null,
    frost_hail_risk_en: form.frost_hail_risk_en || null,
    vine_wine_impact_fr: form.vine_wine_impact_fr || null,
    vine_wine_impact_en: form.vine_wine_impact_en || null,
    carousel_order: form.carousel_order ?? null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createClimateType(
  form: ClimateTypeForm,
): Promise<{ error?: string; id?: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("climate_types")
    .insert(formToRow(form))
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/climate-types");
  return { id: data.id as string };
}

export async function updateClimateType(
  id: string,
  form: ClimateTypeForm,
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("climate_types")
    .update({ ...formToRow(form), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/climate-types");
  return {};
}

export async function deleteClimateType(
  id: string,
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("climate_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/climate-types");
  return {};
}

export async function getClimateRegionLinks(
  climateId: string,
): Promise<ClimateLinkedRegion[]> {
  const supabase = getSupabaseAdmin();
  const { data: links, error } = await supabase
    .from("climate_wine_region_link")
    .select("region_id, is_primary")
    .eq("climate_id", climateId);
  if (error) throw new Error(error.message);
  const rows = links ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.region_id as string);
  const primaryById = new Map(
    rows.map((r) => [r.region_id as string, Boolean(r.is_primary)]),
  );
  const { data: regions, error: regError } = await supabase
    .from("wine_regions")
    .select("id, name_fr, slug")
    .in("id", ids)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (regError) throw new Error(regError.message);
  return ((regions ?? []) as Array<{ id: string; name_fr: string; slug: string }>).map(
    (r) => ({
      ...r,
      is_primary: primaryById.get(r.id) ?? false,
    }),
  );
}

export async function getAllWineRegionsLite(): Promise<
  Array<{ id: string; name_fr: string; slug: string }>
> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("id, name_fr, slug")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string; name_fr: string; slug: string }>;
}

export async function setClimateRegionLinks(
  climateId: string,
  links: Array<{ regionId: string; isPrimary: boolean }>,
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();

  // is_primary = this climate is the region's dominant climate (unique per region).
  // Demote other climates on regions we claim as primary before insert.
  const primaryRegionIds = links
    .filter((l) => l.isPrimary)
    .map((l) => l.regionId);
  if (primaryRegionIds.length > 0) {
    const { error: demoteError } = await supabase
      .from("climate_wine_region_link")
      .update({ is_primary: false })
      .in("region_id", primaryRegionIds)
      .neq("climate_id", climateId);
    if (demoteError) return { error: demoteError.message };
  }

  const { error: delError } = await supabase
    .from("climate_wine_region_link")
    .delete()
    .eq("climate_id", climateId);
  if (delError) return { error: delError.message };

  if (links.length === 0) {
    revalidatePath("/admin/climate-types");
    return {};
  }

  const { error } = await supabase.from("climate_wine_region_link").insert(
    links.map((l) => ({
      climate_id: climateId,
      region_id: l.regionId,
      is_primary: l.isPrimary,
    })),
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/climate-types");
  return {};
}

export async function getClimateGrapeLinks(
  climateId: string,
): Promise<ClimateLinkedGrape[]> {
  const supabase = getSupabaseAdmin();
  const { data: links, error } = await supabase
    .from("climate_grape_link")
    .select("grape_id")
    .eq("climate_id", climateId);
  if (error) throw new Error(error.message);
  const ids = (links ?? []).map((l) => l.grape_id as string);
  if (ids.length === 0) return [];
  const { data: grapes, error: gError } = await supabase
    .from("grapes")
    .select("id, name_fr, slug")
    .in("id", ids)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (gError) throw new Error(gError.message);
  return (grapes ?? []) as ClimateLinkedGrape[];
}

export async function getAllGrapesLite(): Promise<ClimateLinkedGrape[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grapes")
    .select("id, name_fr, slug")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClimateLinkedGrape[];
}

export async function setClimateGrapeLinks(
  climateId: string,
  grapeIds: string[],
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error: delError } = await supabase
    .from("climate_grape_link")
    .delete()
    .eq("climate_id", climateId);
  if (delError) return { error: delError.message };
  if (grapeIds.length === 0) {
    revalidatePath("/admin/climate-types");
    return {};
  }
  const { error } = await supabase.from("climate_grape_link").insert(
    grapeIds.map((grape_id) => ({ climate_id: climateId, grape_id })),
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/climate-types");
  return {};
}
