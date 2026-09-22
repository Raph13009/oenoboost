import { createClient } from "@/lib/supabase/server";

export type DgcChildSummary = {
  id: number;
  slug: string;
  name: string;
  area_hectares: number | null;
  explanation_fr: string | null;
  explanation_en: string | null;
  sort_order: number;
};

export type DgcParentRef = {
  id: number;
  slug: string;
  name: string;
  region_slug: string | null;
};

/**
 * Children attached to a parent AOP via `aop_dgc_link`.
 */
export async function getDgcChildrenForParent(
  parentAopId: number,
): Promise<DgcChildSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aop_dgc_link")
    .select(
      `
      explanation_fr,
      explanation_en,
      sort_order,
      child:child_aop_id(
        id,
        slug,
        name,
        area_hectares,
        deleted_at
      )
    `,
    )
    .eq("parent_aop_id", parentAopId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch DGC children: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => {
      const raw = (
        row as {
          child:
            | {
                id: number;
                slug: string;
                name: string;
                area_hectares: number | null;
                deleted_at: string | null;
              }
            | {
                id: number;
                slug: string;
                name: string;
                area_hectares: number | null;
                deleted_at: string | null;
              }[]
            | null;
        }
      ).child;
      const child = Array.isArray(raw) ? raw[0] ?? null : raw;
      if (!child || child.deleted_at) return null;
      return {
        id: child.id,
        slug: child.slug,
        name: child.name,
        area_hectares: child.area_hectares,
        explanation_fr: (row as { explanation_fr: string | null }).explanation_fr,
        explanation_en: (row as { explanation_en: string | null }).explanation_en,
        sort_order: Number((row as { sort_order: number }).sort_order ?? 0),
      };
    })
    .filter((row): row is DgcChildSummary => row !== null);
}

/**
 * If `childAopId` is linked as a DGC child, return its parent (+ region slug for href).
 */
export async function getDgcParentForChild(
  childAopId: number,
): Promise<DgcParentRef | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aop_dgc_link")
    .select(
      `
      parent:parent_aop_id(
        id,
        slug,
        name,
        deleted_at
      )
    `,
    )
    .eq("child_aop_id", childAopId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch DGC parent: ${error.message}`);
  }
  if (!data) return null;

  const raw = (
    data as {
      parent:
        | { id: number; slug: string; name: string; deleted_at: string | null }
        | { id: number; slug: string; name: string; deleted_at: string | null }[]
        | null;
    }
  ).parent;
  const parent = Array.isArray(raw) ? raw[0] ?? null : raw;
  if (!parent || parent.deleted_at) return null;

  const { data: links } = await supabase
    .from("aop_subregion_link")
    .select(
      "subregion:subregion_id(region:wine_regions!subregions_region_id_fkey(slug))",
    )
    .eq("aop_id", parent.id)
    .limit(1);

  const link = links?.[0] as
    | {
        subregion:
          | { region: { slug: string } | { slug: string }[] | null }
          | { region: { slug: string } | { slug: string }[] | null }[]
          | null;
      }
    | undefined;
  const subRaw = link?.subregion ?? null;
  const sub = Array.isArray(subRaw) ? subRaw[0] ?? null : subRaw;
  const regionRaw = sub?.region ?? null;
  const region = Array.isArray(regionRaw) ? regionRaw[0] ?? null : regionRaw;

  return {
    id: parent.id,
    slug: parent.slug,
    name: parent.name,
    region_slug: region?.slug ?? null,
  };
}
