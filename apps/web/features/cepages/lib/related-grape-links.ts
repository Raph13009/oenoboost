import type { RelatedGrape } from "../types";
import { isGrapeWineColor } from "@/features/vignoble/lib/grape-color-groups";

export type GrapeLinkRow = {
  grape_id: string;
  is_primary: boolean | null;
  wine_color: string | null;
};

type GrapeRow = Omit<RelatedGrape, "is_primary" | "wine_color">;

/**
 * One public grape entry per AOP link row so the same variety can appear
 * under more than one wine color.
 */
export function expandRelatedGrapeLinks(
  links: GrapeLinkRow[],
  grapes: GrapeRow[],
): RelatedGrape[] {
  const grapesById = new Map(grapes.map((grape) => [grape.id, grape]));

  return links
    .map((link) => {
      const grape = grapesById.get(link.grape_id);
      if (!grape) return null;
      const wineColor = link.wine_color;
      return {
        ...grape,
        is_primary: Boolean(link.is_primary),
        wine_color: isGrapeWineColor(wineColor) ? wineColor : null,
      };
    })
    .filter((row): row is RelatedGrape => row !== null)
    .sort((a, b) => a.name_fr.localeCompare(b.name_fr, "fr", { sensitivity: "base" }));
}
