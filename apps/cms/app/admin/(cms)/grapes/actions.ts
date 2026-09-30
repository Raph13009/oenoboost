"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import {
  normalizeGrapeRadarFields,
  validateGrapeRadarFields,
} from "@/lib/grape-radar";
import { normalizeRichTextForStorage } from "@/lib/richtext-html";
import { revalidatePath } from "next/cache";

export type Grape = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  type: string | null;
  origin_country: string | null;
  origin_region_fr: string | null;
  origin_region_en: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
  history_fr: string | null;
  history_en: string | null;
  crossings_fr: string | null;
  crossings_en: string | null;
  production_regions_fr: string | null;
  production_regions_en: string | null;
  viticultural_traits_fr: string | null;
  viticultural_traits_en: string | null;
  tasting_traits_fr: string | null;
  tasting_traits_en: string | null;
  emblematic_wines_fr: string | null;
  emblematic_wines_en: string | null;
  /** Profil du cépage axes (0–8). Null when unset. */
  radar_acidity: number | null;
  radar_body: number | null;
  radar_aromatic_intensity: number | null;
  radar_tannins: number | null;
  radar_alcohol_potential: number | null;
  /** JSON array of English country names, e.g. ["France", "USA"] */
  production_countries: string[] | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type GrapeEmblematicAop = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type GrapeListItem = Pick<
  Grape,
  "id" | "slug" | "name_fr" | "name_en" | "type" | "origin_country" | "status" | "updated_at"
>;

const GRAPE_LIST_COLUMNS = "id,slug,name_fr,name_en,type,origin_country,status,updated_at";
const GRAPE_DETAIL_COLUMNS =
  "id,slug,name_fr,name_en,type,origin_country,origin_region_fr,origin_region_en,origin_latitude,origin_longitude,history_fr,history_en,crossings_fr,crossings_en,production_regions_fr,production_regions_en,viticultural_traits_fr,viticultural_traits_en,tasting_traits_fr,tasting_traits_en,emblematic_wines_fr,emblematic_wines_en,radar_acidity,radar_body,radar_aromatic_intensity,radar_tannins,radar_alcohol_potential,production_countries,is_premium,status,published_at,created_at,updated_at,deleted_at";

function toNumberId(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseProductionCountries(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const strings = raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return normalizeProductionCountries(strings);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parseProductionCountries(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

/** Dedupe (case-insensitive), trim; sort A–Z for stable JSON in DB. */
function normalizeProductionCountries(names: string[]): string[] | null {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const t = n.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  if (out.length === 0) return null;
  out.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return out;
}

export async function getGrapesLite(): Promise<Array<Pick<Grape, "id" | "name_fr">>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grapes")
    .select("id,name_fr")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string; name_fr: string }>).map((row) => ({
    id: row.id,
    name_fr: row.name_fr,
  }));
}

export async function getGrapes(): Promise<GrapeListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grapes")
    .select(GRAPE_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GrapeListItem[];
}

export async function getGrape(id: string): Promise<Grape | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grapes")
    .select(GRAPE_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const radar = normalizeGrapeRadarFields({
    radar_acidity: (row.radar_acidity as number | null) ?? null,
    radar_body: (row.radar_body as number | null) ?? null,
    radar_aromatic_intensity:
      (row.radar_aromatic_intensity as number | null) ?? null,
    radar_tannins: (row.radar_tannins as number | null) ?? null,
    radar_alcohol_potential:
      (row.radar_alcohol_potential as number | null) ?? null,
  });
  return {
    ...(row as unknown as Grape),
    ...radar,
    production_countries: parseProductionCountries(row.production_countries),
  };
}

type GrapeForm = Omit<Grape, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string };

function formToRow(
  form: GrapeForm,
): { error: string } | { row: Record<string, unknown> } {
  const radar = {
    radar_acidity: form.radar_acidity ?? null,
    radar_body: form.radar_body ?? null,
    radar_aromatic_intensity: form.radar_aromatic_intensity ?? null,
    radar_tannins: form.radar_tannins ?? null,
    radar_alcohol_potential: form.radar_alcohol_potential ?? null,
  };
  const radarError = validateGrapeRadarFields(radar);
  if (radarError) return { error: radarError };
  const normalizedRadar = normalizeGrapeRadarFields(radar);

  return {
    row: {
      slug: form.slug || null,
      name_fr: form.name_fr || "",
      name_en: form.name_en || null,
      type: form.type || null,
      origin_country: form.origin_country || null,
      origin_region_fr: form.origin_region_fr || null,
      origin_region_en: form.origin_region_en || null,
      origin_latitude: form.origin_latitude ?? null,
      origin_longitude: form.origin_longitude ?? null,
      history_fr: normalizeRichTextForStorage(form.history_fr),
      history_en: normalizeRichTextForStorage(form.history_en),
      crossings_fr: normalizeRichTextForStorage(form.crossings_fr),
      crossings_en: normalizeRichTextForStorage(form.crossings_en),
      production_regions_fr: normalizeRichTextForStorage(form.production_regions_fr),
      production_regions_en: normalizeRichTextForStorage(form.production_regions_en),
      viticultural_traits_fr: normalizeRichTextForStorage(form.viticultural_traits_fr),
      viticultural_traits_en: normalizeRichTextForStorage(form.viticultural_traits_en),
      tasting_traits_fr: normalizeRichTextForStorage(form.tasting_traits_fr),
      tasting_traits_en: normalizeRichTextForStorage(form.tasting_traits_en),
      emblematic_wines_fr: form.emblematic_wines_fr || null,
      emblematic_wines_en: form.emblematic_wines_en || null,
      ...normalizedRadar,
      production_countries: normalizeProductionCountries(form.production_countries ?? []),
      is_premium: !!form.is_premium,
      status: form.status || "draft",
      published_at: form.published_at || null,
    },
  };
}

export async function createGrape(form: GrapeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const prepared = formToRow(form);
  if ("error" in prepared) return { error: prepared.error };
  const { error } = await supabase.from("grapes").insert(prepared.row);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function updateGrape(id: string, form: GrapeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const prepared = formToRow(form);
  if ("error" in prepared) return { error: prepared.error };
  const { error } = await supabase.from("grapes").update(prepared.row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function deleteGrape(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("grapes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function getGrapeEmblematicAops(
  grapeId: string,
): Promise<GrapeEmblematicAop[]> {
  const supabase = getSupabaseAdmin();
  const { data: links, error: linksError } = await supabase
    .from("grape_emblematic_aop_link")
    .select("aop_id, sort_order")
    .eq("grape_id", grapeId)
    .order("sort_order", { ascending: true });
  if (linksError) throw new Error(linksError.message);

  const linkRows = (links ?? []) as Array<{
    aop_id: number;
    sort_order: number | null;
  }>;
  if (linkRows.length === 0) return [];

  const aopIds = linkRows.map((row) => row.aop_id);
  const { data: aops, error: aopsError } = await supabase
    .from("aop")
    .select("id, name, slug")
    .in("id", aopIds)
    .is("deleted_at", null);
  if (aopsError) throw new Error(aopsError.message);

  const byId = new Map(
    ((aops ?? []) as Array<{ id: number; name: string; slug: string }>).map(
      (aop) => [aop.id, aop] as const,
    ),
  );
  const sortById = new Map(
    linkRows.map((row) => [row.aop_id, row.sort_order ?? 0] as const),
  );

  return aopIds
    .map((id) => {
      const aop = byId.get(id);
      if (!aop) return null;
      return {
        id: String(aop.id),
        name: aop.name,
        slug: aop.slug,
        sort_order: sortById.get(id) ?? 0,
      } satisfies GrapeEmblematicAop;
    })
    .filter((row): row is GrapeEmblematicAop => row != null)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });
}

export async function searchAopsForGrapeEmblematic(
  query: string,
): Promise<Array<{ id: string; name: string; slug: string }>> {
  const supabase = getSupabaseAdmin();
  const trimmed = query.trim();
  let q = supabase
    .from("aop")
    .select("id, name, slug")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(25);

  if (trimmed) {
    const escaped = trimmed.replaceAll(",", " ");
    q = q.or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{ id: number; name: string; slug: string }>).map(
    (aop) => ({
      id: String(aop.id),
      name: aop.name,
      slug: aop.slug,
    }),
  );
}

export async function addGrapeEmblematicAop(
  grapeId: string,
  aopId: string,
  sortOrder = 0,
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const numericAopId = toNumberId(aopId);
  if (numericAopId === null) return { error: "AOP invalide." };

  const { error } = await supabase.from("grape_emblematic_aop_link").upsert(
    {
      grape_id: grapeId,
      aop_id: numericAopId,
      sort_order: sortOrder,
    },
    { onConflict: "grape_id,aop_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function removeGrapeEmblematicAop(
  grapeId: string,
  aopId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const numericAopId = toNumberId(aopId);
  if (numericAopId === null) return { error: "AOP invalide." };

  const { error } = await supabase
    .from("grape_emblematic_aop_link")
    .delete()
    .eq("grape_id", grapeId)
    .eq("aop_id", numericAopId);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}
