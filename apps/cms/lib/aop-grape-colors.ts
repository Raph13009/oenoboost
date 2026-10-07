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
