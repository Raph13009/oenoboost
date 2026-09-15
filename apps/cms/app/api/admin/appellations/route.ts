import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: aopData, error: aopError } = await supabase
    .from("aop")
    .select("id,slug,name,status,updated_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (aopError) {
    return NextResponse.json({ error: aopError.message }, { status: 500 });
  }

  const aopRows = (aopData ?? []) as unknown as Array<{
    id: number;
    slug: string;
    name: string;
    status: string;
    updated_at: string;
  }>;
  const aopIds = aopRows.map((row) => row.id);
  const { data: linkData, error: linkError } = await supabase
    .from("aop_subregion_link")
    .select(
      `
      aop_id,
      subregion_id,
      subregions!subregion_id(
        id,
        name_fr,
        region_id,
        wine_regions!region_id(name_fr)
      )
    `
    )
    .in("aop_id", aopIds);
  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const firstSubregionByAop = new Map<
    number,
    { id: string; name_fr: string | null; region_id: string | null; region_name_fr: string | null }
  >();
  const aopLinks = (linkData ?? []) as unknown as Array<{
    aop_id: number;
    subregion_id: number;
    subregions:
      | {
          id: number;
          name_fr: string | null;
          region_id: string | null;
          wine_regions: { name_fr: string | null } | { name_fr: string | null }[] | null;
        }
      | null;
  }>;
  for (const link of aopLinks) {
    if (firstSubregionByAop.has(link.aop_id)) continue;
    const subregion = link.subregions;
    const region = Array.isArray(subregion?.wine_regions)
      ? subregion?.wine_regions[0]
      : subregion?.wine_regions;
    firstSubregionByAop.set(link.aop_id, {
      id: subregion?.id != null ? String(subregion.id) : String(link.subregion_id),
      name_fr: subregion?.name_fr ?? null,
      region_id: subregion?.region_id ?? null,
      region_name_fr: region?.name_fr ?? null,
    });
  }

  const appellations = aopRows.map((row) => {
    const sr = firstSubregionByAop.get(row.id);

    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      status: row.status,
      updated_at: row.updated_at,
      subregion_id: sr?.id ?? null,
      subregion_name_fr: sr?.name_fr ?? null,
      region_name_fr: sr?.region_name_fr ?? null,
      region_id: sr?.region_id ?? null,
    };
  });

  return NextResponse.json({ appellations });
}
