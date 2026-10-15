import { createClient } from "@/lib/supabase/server";
import type { ClimateType } from "../types";

export async function isClimateFavorited(userId: string, climateId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", "climate_type")
    .eq("content_id", climateId)
    .eq("module", "climat")
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}

export type FavoriteClimateRow = {
  favoriteId: string;
  climate: Pick<ClimateType, "id" | "slug" | "name_fr" | "name_en" | "color_hex">;
};

export async function getFavoriteClimatesForUser(
  userId: string,
): Promise<FavoriteClimateRow[]> {
  const supabase = await createClient();

  const { data: favs, error: favError } = await supabase
    .from("favorites")
    .select("id, content_id, created_at")
    .eq("user_id", userId)
    .eq("content_type", "climate_type")
    .eq("module", "climat")
    .order("created_at", { ascending: false });

  if (favError || !favs?.length) return [];

  const ids = favs.map((f) => f.content_id);
  const { data: climates, error } = await supabase
    .from("climate_types")
    .select("id, slug, name_fr, name_en, color_hex")
    .in("id", ids)
    .is("deleted_at", null);

  if (error || !climates) return [];

  const byId = new Map(climates.map((c) => [c.id, c]));
  const out: FavoriteClimateRow[] = [];
  for (const f of favs) {
    const c = byId.get(f.content_id);
    if (c) out.push({ favoriteId: f.id, climate: c });
  }
  return out;
}
