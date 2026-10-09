import { createClient } from "@/lib/supabase/server";
import type { EmblematicAop, Grape, RelatedGrape } from "../types";
import { expandRelatedGrapeLinks } from "../lib/related-grape-links";

const GRAPE_COLUMNS =
  "id, slug, name_fr, name_en, type, origin_country, origin_region_fr, origin_region_en, origin_latitude, origin_longitude, history_fr, history_en, crossings_fr, crossings_en, production_regions_fr, production_regions_en, production_countries, viticultural_traits_fr, viticultural_traits_en, tasting_traits_fr, tasting_traits_en, emblematic_wines_fr, emblematic_wines_en, radar_acidity, radar_body, radar_aromatic_intensity, radar_tannins, radar_alcohol_potential, is_premium, status, published_at, created_at, updated_at, deleted_at";

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
 * Callers group by `wine_color`, then main/classic (`is_primary`) vs accessory.
 */
export async function getRelatedGrapesForAppellation(
  appellationId: number,
): Promise<RelatedGrape[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("aop_grape_link")
    .select("grape_id, is_primary, wine_color")
    .eq("aop_id", appellationId);

  if (linksError) {
    throw new Error(`Failed to fetch appellation grapes: ${linksError.message}`);
  }

  const linkRows = ((links ?? []) as {
    grape_id: string | null;
    is_primary: boolean | null;
    wine_color: string | null;
  }[])
    .filter(
      (row): row is { grape_id: string; is_primary: boolean | null; wine_color: string | null } =>
        Boolean(row.grape_id),
    );

  const grapeIds = Array.from(new Set(linkRows.map((link) => link.grape_id)));

  if (grapeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("grapes")
    .select("id, slug, name_fr, is_premium")
    .in("id", grapeIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to fetch related grapes: ${error.message}`);
  }

  return expandRelatedGrapeLinks(
    linkRows,
    (data ?? []) as Omit<RelatedGrape, "is_primary" | "wine_color">[],
  );
}

/**
 * Curated emblematic AOPs for a grape fiche (`grape_emblematic_aop_link`).
 * Resolves region/subregion slugs for AOP detail hrefs (same idea as soils).
 */
export async function getEmblematicAopsForGrape(
  grapeId: string,
): Promise<EmblematicAop[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("grape_emblematic_aop_link")
    .select("aop_id, sort_order")
    .eq("grape_id", grapeId)
    .order("sort_order", { ascending: true });

  if (linksError) {
    throw new Error(
      `Failed to fetch grape emblematic AOP links: ${linksError.message}`,
    );
  }

  const linkRows = (links ?? []) as {
    aop_id: number | null;
    sort_order: number | null;
  }[];

  const aopIds = Array.from(
    new Set(
      linkRows
        .map((link) => link.aop_id)
        .filter((value): value is number => typeof value === "number"),
    ),
  );

  if (aopIds.length === 0) {
    return [];
  }

  const sortByAop = new Map(
    linkRows
      .filter(
        (row): row is { aop_id: number; sort_order: number | null } =>
          typeof row.aop_id === "number",
      )
      .map((row) => [row.aop_id, row.sort_order ?? 0] as const),
  );

  const { data: aops, error: aopsError } = await supabase
    .from("aop")
    .select("id, slug, name, status, published_at, deleted_at")
    .in("id", aopIds)
    .is("deleted_at", null);

  if (aopsError) {
    throw new Error(`Failed to fetch emblematic AOPs: ${aopsError.message}`);
  }

  const publishedAops = (aops ?? []) as {
    id: number;
    slug: string;
    name: string;
  }[];

  if (publishedAops.length === 0) {
    return [];
  }

  const { data: subLinkRows, error: subLinkErr } = await supabase
    .from("aop_subregion_link")
    .select("aop_id, subregion_id")
    .in(
      "aop_id",
      publishedAops.map((a) => a.id),
    )
    .not("subregion_id", "is", null);

  if (subLinkErr) {
    throw new Error(
      `Failed to fetch emblematic AOP navigation data: ${subLinkErr.message}`,
    );
  }

  const firstSubregionByAop = new Map<number, number>();
  for (const row of subLinkRows ?? []) {
    const aid = row.aop_id as number | null;
    const sid = row.subregion_id as number | null;
    if (aid == null || sid == null || firstSubregionByAop.has(aid)) continue;
    firstSubregionByAop.set(aid, sid);
  }

  const subIds = [...new Set(firstSubregionByAop.values())];
  const routeByAopId = new Map<
    number,
    { region_slug: string; subregion_slug: string }
  >();

  if (subIds.length > 0) {
    const { data: subregions, error: subErr } = await supabase
      .from("subregions")
      .select("id, slug, region_id")
      .in("id", subIds)
      .is("deleted_at", null);

    if (subErr) {
      throw new Error(
        `Failed to fetch subregions for grape AOP links: ${subErr.message}`,
      );
    }

    const regionIds = [
      ...new Set((subregions ?? []).map((s) => s.region_id)),
    ];

    const { data: regions, error: regErr } = await supabase
      .from("wine_regions")
      .select("id, slug")
      .in("id", regionIds)
      .is("deleted_at", null);

    if (regErr) {
      throw new Error(
        `Failed to fetch regions for grape AOP links: ${regErr.message}`,
      );
    }

    const regionSlugById = new Map(
      (regions ?? []).map((r) => [r.id, r.slug] as const),
    );
    const subById = new Map(
      (subregions ?? []).map((s) => [s.id, s] as const),
    );

    for (const [aopId, subId] of firstSubregionByAop) {
      const sub = subById.get(subId);
      if (!sub) continue;
      const regionSlug = regionSlugById.get(sub.region_id);
      if (!regionSlug || !sub.slug) continue;
      routeByAopId.set(aopId, {
        region_slug: regionSlug,
        subregion_slug: sub.slug,
      });
    }
  }

  return publishedAops
    .map((aop) => {
      const route = routeByAopId.get(aop.id);
      if (!route) return null;
      return {
        id: aop.id,
        slug: aop.slug,
        name: aop.name,
        region_slug: route.region_slug,
        subregion_slug: route.subregion_slug,
      } satisfies EmblematicAop;
    })
    .filter((row): row is EmblematicAop => row != null)
    .sort((a, b) => {
      const sa = sortByAop.get(a.id) ?? 0;
      const sb = sortByAop.get(b.id) ?? 0;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });
}
