"use server";

import { createClient } from "@/lib/supabase/server";
import { getRelatedGrapesForAppellation } from "@/features/cepages/queries/grapes.queries";
import type { RelatedGrape } from "@/features/cepages/types";
import { getDgcParentForChild } from "@/features/vignoble/queries/aop-dgc.queries";

export type AopMapGrape = Pick<
  RelatedGrape,
  "id" | "slug" | "name_fr" | "is_primary"
>;

export type AopMapInfo = {
  id: number;
  /** Display name of the clicked polygon (child or parent). */
  name: string;
  area_hectares: number | null;
  is_grand_cru: boolean;
  grapes: AopMapGrape[];
  /** Region used for the "open fiche" href (parent when linked). */
  region_slug: string | null;
  subregion_slug: string | null;
  /** Slug of the fiche to open (parent AOP when this polygon is a DGC child). */
  fiche_slug: string | null;
  /** When set, fiche should highlight this DGC tab (`?dgc=`). */
  dgc_slug: string | null;
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

  const dgcParent = await getDgcParentForChild(aopId);
  const isChild = Boolean(dgcParent && dgcParent.slug !== (aop.slug as string));

  return {
    id: aop.id as number,
    name: aop.name as string,
    area_hectares: (aop.area_hectares ?? null) as number | null,
    is_grand_cru: Boolean(aop.is_grand_cru),
    grapes,
    region_slug: isChild
      ? (dgcParent?.region_slug ?? region?.slug ?? null)
      : (region?.slug ?? null),
    subregion_slug: sub?.slug ?? null,
    fiche_slug: isChild
      ? (dgcParent?.slug ?? (aop.slug as string))
      : (aop.slug as string),
    dgc_slug: isChild ? (aop.slug as string) : null,
  };
}
