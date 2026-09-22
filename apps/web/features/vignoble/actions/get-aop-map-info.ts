"use server";

import { createClient } from "@/lib/supabase/server";
import { getRelatedGrapesForAppellation } from "@/features/cepages/queries/grapes.queries";
import type { RelatedGrape } from "@/features/cepages/types";

export type AopMapGrape = Pick<
  RelatedGrape,
  "id" | "slug" | "name_fr" | "is_primary"
>;

export type AopMapInfo = {
  id: number;
  slug: string;
  name: string;
  area_hectares: number | null;
  is_grand_cru: boolean;
  region_slug: string | null;
  subregion_slug: string | null;
  grapes: AopMapGrape[];
};

type SubregionEmbed = {
  slug: string;
  region: { slug: string } | { slug: string }[] | null;
};

type LinkRow = {
  subregion: SubregionEmbed | SubregionEmbed[] | null;
};

/**
 * Server action: fetch the minimal AOP info needed to populate the map's
 * bottom panel when an AOP polygon is clicked. Exposed as a server action so
 * the client map component has an explicit RPC boundary instead of issuing
 * Supabase calls from the browser.
 */
export async function getAopMapInfo(aopId: number): Promise<AopMapInfo | null> {
  if (!Number.isInteger(aopId) || aopId <= 0) return null;

  const supabase = await createClient();

  const { data: aop, error: aopError } = await supabase
    .from("aop")
    .select("id, slug, name, area_hectares, is_grand_cru")
    .eq("id", aopId)
    .is("deleted_at", null)
    .maybeSingle();

  if (aopError) {
    throw new Error(`Failed to fetch AOP info: ${aopError.message}`);
  }
  if (!aop) return null;

  const { data: linkData, error: linkError } = await supabase
    .from("aop_subregion_link")
    .select(
      "subregion:subregion_id(slug, region:wine_regions!subregions_region_id_fkey(slug))",
    )
    .eq("aop_id", aopId)
    .limit(1);

  if (linkError) {
    throw new Error(`Failed to fetch AOP link: ${linkError.message}`);
  }

  const link = (linkData?.[0] ?? null) as LinkRow | null;
  const subRaw = link?.subregion ?? null;
  const sub = Array.isArray(subRaw) ? subRaw[0] ?? null : subRaw;
  const regionRaw = sub?.region ?? null;
  const region = Array.isArray(regionRaw) ? regionRaw[0] ?? null : regionRaw;

  const relatedGrapes = await getRelatedGrapesForAppellation(aopId);
  const grapes: AopMapGrape[] = relatedGrapes.map((g) => ({
    id: g.id,
    slug: g.slug,
    name_fr: g.name_fr,
    is_primary: g.is_primary,
  }));

  return {
    id: aop.id as number,
    slug: aop.slug as string,
    name: aop.name as string,
    area_hectares: (aop.area_hectares ?? null) as number | null,
    is_grand_cru: Boolean(aop.is_grand_cru),
    region_slug: region?.slug ?? null,
    subregion_slug: sub?.slug ?? null,
    grapes,
  };
}
