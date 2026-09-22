"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type WineRegion = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  department_count: number | null;
  area_hectares: number | null;
  total_production_hl: number | null;
  main_grapes_fr: string | null;
  main_grapes_en: string | null;
  geojson: unknown;
  centroid_lat: number | null;
  centroid_lng: number | null;
  color_hex: string | null;
  map_order: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WineRegionListItem = Pick<
  WineRegion,
  "id" | "slug" | "name_fr" | "name_en" | "status" | "updated_at"
>;

const WINE_REGION_LIST_COLUMNS = "id,slug,name_fr,name_en,status,updated_at";
const WINE_REGION_DETAIL_COLUMNS =
  "id,slug,name_fr,name_en,department_count,area_hectares,total_production_hl,main_grapes_fr,main_grapes_en,geojson,centroid_lat,centroid_lng,color_hex,map_order,status,published_at,created_at,updated_at,deleted_at";

export async function getWineRegionsLite(): Promise<Array<Pick<WineRegion, "id" | "name_fr">>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("id,name_fr")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string; name_fr: string }>).map((row) => ({
    id: row.id,
    name_fr: row.name_fr,
  }));
}

export async function getWineRegionsPaginated(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ regions: WineRegionListItem[]; hasPrev: boolean; hasNext: boolean }> {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);
  const fetchLimit = limit + 1;
  const from = offset;
  const to = offset + fetchLimit - 1;

  const { data, error } = await supabase
    .from("wine_regions")
    .select(WINE_REGION_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as WineRegionListItem[];
  const hasNext = rows.length > limit;
  const hasPrev = offset > 0;

  return {
    regions: rows.slice(0, limit),
    hasPrev,
    hasNext,
  };
}

export async function getWineRegion(id: string): Promise<WineRegion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select(WINE_REGION_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as WineRegion;
}

type WineRegionForm = Omit<WineRegion, "id" | "created_at" | "updated_at" | "deleted_at"> & {
  id?: string;
};

function formToRow(form: WineRegionForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || "",
    department_count: form.department_count ?? null,
    area_hectares: form.area_hectares ?? null,
    total_production_hl: form.total_production_hl ?? null,
    main_grapes_fr: form.main_grapes_fr || null,
    main_grapes_en: form.main_grapes_en || null,
    geojson: form.geojson ?? null,
    centroid_lat: form.centroid_lat ?? null,
    centroid_lng: form.centroid_lng ?? null,
    color_hex: form.color_hex || null,
    map_order: form.map_order ?? null,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createWineRegion(form: WineRegionForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_regions").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export async function updateWineRegion(id: string, form: WineRegionForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_regions").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export async function deleteWineRegion(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("wine_regions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export type WineRegionHistoryMilestone = {
  id: string;
  region_id: string;
  milestone_order: number;
  period_label_fr: string;
  period_label_en: string;
  title_fr: string;
  title_en: string;
  detail_fr: string | null;
  detail_en: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WineRegionHistoryMilestoneForm = Omit<
  WineRegionHistoryMilestone,
  "created_at" | "updated_at"
>;

const HISTORY_MILESTONE_COLUMNS =
  "id,region_id,milestone_order,period_label_fr,period_label_en,title_fr,title_en,detail_fr,detail_en,icon_url,created_at,updated_at";

function milestoneFormToRow(form: WineRegionHistoryMilestoneForm): Record<string, unknown> {
  return {
    region_id: form.region_id,
    milestone_order: form.milestone_order,
    period_label_fr: form.period_label_fr || "",
    period_label_en: form.period_label_en || "",
    title_fr: form.title_fr || "",
    title_en: form.title_en || "",
    detail_fr: form.detail_fr || null,
    detail_en: form.detail_en || null,
    icon_url: form.icon_url || null,
    updated_at: new Date().toISOString(),
  };
}

export async function getWineRegionHistoryMilestones(
  regionId: string
): Promise<WineRegionHistoryMilestone[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_region_history_milestones")
    .select(HISTORY_MILESTONE_COLUMNS)
    .eq("region_id", regionId)
    .order("milestone_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WineRegionHistoryMilestone[];
}

export async function createWineRegionHistoryMilestone(
  regionId: string
): Promise<{ milestone?: WineRegionHistoryMilestone; error?: string }> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: readError } = await supabase
    .from("wine_region_history_milestones")
    .select("milestone_order")
    .eq("region_id", regionId)
    .order("milestone_order", { ascending: false })
    .limit(1);

  if (readError) return { error: readError.message };

  const nextOrder =
    ((existing?.[0] as { milestone_order?: number } | undefined)?.milestone_order ?? 0) + 1;
  const { data, error } = await supabase
    .from("wine_region_history_milestones")
    .insert({
      region_id: regionId,
      milestone_order: nextOrder,
      period_label_fr: "",
      period_label_en: "",
      title_fr: `Jalon ${nextOrder}`,
      title_en: `Milestone ${nextOrder}`,
    })
    .select(HISTORY_MILESTONE_COLUMNS)
    .single();

  if (error || !data) return { error: error?.message ?? "Impossible de créer le jalon." };
  revalidatePath("/admin/wine-regions");
  return { milestone: data as WineRegionHistoryMilestone };
}

export async function updateWineRegionHistoryMilestone(
  id: string,
  form: WineRegionHistoryMilestoneForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = milestoneFormToRow(form);
  const { error } = await supabase.from("wine_region_history_milestones").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export async function deleteWineRegionHistoryMilestone(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();

  const { data: milestone, error: readError } = await supabase
    .from("wine_region_history_milestones")
    .select("region_id")
    .eq("id", id)
    .single();
  if (readError || !milestone) return { error: readError?.message ?? "Jalon introuvable." };

  const regionId = (milestone as { region_id: string }).region_id;
  const { error } = await supabase.from("wine_region_history_milestones").delete().eq("id", id);
  if (error) return { error: error.message };

  const { data: remaining, error: remainingError } = await supabase
    .from("wine_region_history_milestones")
    .select("id")
    .eq("region_id", regionId)
    .order("milestone_order", { ascending: true });
  if (remainingError) return { error: remainingError.message };

  const remainingMilestones = remaining ?? [];
  for (let index = 0; index < remainingMilestones.length; index += 1) {
    const row = remainingMilestones[index];
    const { error: reorderError } = await supabase
      .from("wine_region_history_milestones")
      .update({ milestone_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", (row as { id: string }).id);
    if (reorderError) return { error: reorderError.message };
  }

  revalidatePath("/admin/wine-regions");
  return {};
}

export async function reorderWineRegionHistoryMilestones(
  regionId: string,
  orderedMilestoneIds: string[]
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();

  for (let index = 0; index < orderedMilestoneIds.length; index += 1) {
    const milestoneId = orderedMilestoneIds[index];
    const { error } = await supabase
      .from("wine_region_history_milestones")
      .update({ milestone_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", milestoneId)
      .eq("region_id", regionId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/wine-regions");
  return {};
}
