"use server";

import { createClient } from "@/lib/supabase/server";
import type { WineRegionHistoryMilestone } from "@/features/vignoble/types";

const MILESTONE_COLUMNS =
  "id, region_id, milestone_order, period_label_fr, period_label_en, title_fr, title_en, detail_fr, detail_en, icon_url, created_at, updated_at";

/**
 * Server action: history milestones for the map region footer panel.
 */
export async function getRegionHistoryMilestonesAction(
  regionId: string,
): Promise<WineRegionHistoryMilestone[]> {
  if (!regionId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wine_region_history_milestones")
    .select(MILESTONE_COLUMNS)
    .eq("region_id", regionId)
    .order("milestone_order", { ascending: true });

  if (error) {
    console.error("[getRegionHistoryMilestonesAction]", error.message);
    return [];
  }

  return (data ?? []) as WineRegionHistoryMilestone[];
}
