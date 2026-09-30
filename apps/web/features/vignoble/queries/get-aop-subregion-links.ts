import { createClient } from "@/lib/supabase/client";

/**
 * AOP id → linked subregion ids (`aop_subregion_link`).
 * Used by the vineyard map AOP side list to filter on selected subregion.
 */
export async function getAopSubregionLinks(
  aopIds: number[],
): Promise<Map<number, number[]>> {
  const out = new Map<number, number[]>();
  if (aopIds.length === 0) return out;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("aop_subregion_link")
    .select("aop_id, subregion_id")
    .in("aop_id", aopIds);

  if (error) {
    throw new Error(`Failed to fetch AOP subregion links: ${error.message}`);
  }

  for (const row of data ?? []) {
    const aopId = row.aop_id as number | null;
    const subId = row.subregion_id as number | null;
    if (aopId == null || subId == null) continue;
    const existing = out.get(aopId);
    if (existing) {
      if (!existing.includes(subId)) existing.push(subId);
    } else {
      out.set(aopId, [subId]);
    }
  }

  return out;
}
