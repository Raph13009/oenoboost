import type { WineColorBreakdown } from "./aop-wine-color-breakdown";

/** Display order for grape sections: blanc, rouge, rosé, effervescent, liquoreux. */
export const GRAPE_WINE_COLOR_ORDER = [
  "white",
  "red",
  "rose",
  "sparkling",
  "liqueur",
] as const;

export type GrapeWineColor = (typeof GRAPE_WINE_COLOR_ORDER)[number];

const PCT_FIELD: Record<GrapeWineColor, keyof WineColorBreakdown> = {
  white: "wine_pct_white",
  red: "wine_pct_red",
  rose: "wine_pct_rose",
  sparkling: "wine_pct_sparkling",
  liqueur: "wine_pct_liqueur",
};

export function isGrapeWineColor(value: string | null | undefined): value is GrapeWineColor {
  return (
    value != null &&
    (GRAPE_WINE_COLOR_ORDER as readonly string[]).includes(value)
  );
}

/** Colors whose production share is strictly above 0, in display order. */
export function producedGrapeColors(pct: WineColorBreakdown): GrapeWineColor[] {
  return GRAPE_WINE_COLOR_ORDER.filter((color) => (pct[PCT_FIELD[color]] ?? 0) > 0);
}

/**
 * Search results for one color section. A grape already linked under this
 * color is hidden; the same grape remains available for other colors.
 */
export function filterGrapeSearchForColor<T extends { id: string }>(
  results: T[],
  selected: ReadonlyArray<{ id: string; wine_color: GrapeWineColor | null }>,
  activeColor: GrapeWineColor,
): T[] {
  const selectedInColor = new Set(
    selected
      .filter((item) => item.wine_color === activeColor)
      .map((item) => item.id),
  );
  return results.filter((item) => !selectedInColor.has(item.id));
}
