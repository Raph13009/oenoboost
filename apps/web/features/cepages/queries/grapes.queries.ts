import { createClient } from "@/lib/supabase/server";
import type { Grape, RelatedGrape } from "../types";

const GRAPE_COLUMNS =
  "id, slug, name_fr, name_en, type, origin_country, origin_region_fr, origin_region_en, origin_latitude, origin_longitude, history_fr, history_en, crossings_fr, crossings_en, production_regions_fr, production_regions_en, production_countries, viticultural_traits_fr, viticultural_traits_en, tasting_traits_fr, tasting_traits_en, emblematic_wines_fr, emblematic_wines_en, is_premium, status, published_at, created_at, updated_at, deleted_at";

export async function getGrapes(type?: "red" | "white") {
  const supabase = await createClient();

  let query = supabase
    .from("grapes")
    .select(GRAPE_COLUMNS)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch grapes: ${error.message}`);
  return (data ?? []) as Grape[];
}

export async function getGrapeBySlug(slug: string) {
  const supabase = await createClient();

  const query = supabase
    .from("grapes")
    .select(GRAPE_COLUMNS)
    .eq("slug", slug)
    .is("deleted_at", null);

  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch grape: ${error.message}`);
  }
  return data as Grape;
}

/** Total grapes (same filters as list queries). */
export async function getGrapesCount() {
  const supabase = await createClient();

  const query = supabase
    .from("grapes")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count, error } = await query;
  if (error) throw new Error(`Failed to count grapes: ${error.message}`);
  return count ?? 0;
}

/**
 * Structured AOP ↔ grape links (`aop_grape_link`).
 * Main/classic first (`is_primary`), then accessory, then name.
 */
export async function getRelatedGrapesForAppellation(
  appellationId: number,
): Promise<RelatedGrape[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("aop_grape_link")
    .select("grape_id, is_primary")
    .eq("aop_id", appellationId);

  if (linksError) {
    throw new Error(`Failed to fetch appellation grapes: ${linksError.message}`);
  }

  const linkRows = (links ?? []) as {
    grape_id: string | null;
    is_primary: boolean | null;
  }[];

  const grapeIds = Array.from(
    new Set(
      linkRows
        .map((link) => link.grape_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (grapeIds.length === 0) {
    return [];
  }

  const primaryById = new Map(
    linkRows
      .filter((row): row is { grape_id: string; is_primary: boolean | null } =>
        Boolean(row.grape_id),
      )
      .map((row) => [row.grape_id, Boolean(row.is_primary)] as const),
  );

  const { data, error } = await supabase
    .from("grapes")
    .select("id, slug, name_fr, is_premium")
    .in("id", grapeIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to fetch related grapes: ${error.message}`);
  }

  return ((data ?? []) as Omit<RelatedGrape, "is_primary">[])
    .map((grape) => ({
      ...grape,
      is_primary: primaryById.get(grape.id) ?? true,
    }))
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.name_fr.localeCompare(b.name_fr, "fr", { sensitivity: "base" });
    });
}
