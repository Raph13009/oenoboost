import { createClient } from "@/lib/supabase/server";
import type { WineRegionHistoryMilestone } from "../types";

const MILESTONE_COLUMNS =
  "id, region_id, milestone_order, period_label_fr, period_label_en, title_fr, title_en, detail_fr, detail_en, icon_url, created_at, updated_at";

export async function getRegionHistoryMilestones(
  regionId: string,
): Promise<WineRegionHistoryMilestone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wine_region_history_milestones")
    .select(MILESTONE_COLUMNS)
    .eq("region_id", regionId)
    .order("milestone_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch region history milestones: ${error.message}`);
  }

  return (data ?? []) as WineRegionHistoryMilestone[];
}
