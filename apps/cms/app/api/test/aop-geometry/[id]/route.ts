import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type Ctx = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: Ctx) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  const { data, error } = await supabase
    .from("appellations")
    .select("name_fr, geojson")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Appellation not found" }, { status: 404 });
  }

  return NextResponse.json({
    name_fr: (data as { name_fr: string }).name_fr,
    geojson: (data as { geojson: unknown }).geojson,
  });
}

