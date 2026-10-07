import type { WineColorKey } from "./wine-color-breakdown";
import { getWineColorBreakdown } from "./wine-color-breakdown";

/** Blanc, rouge, rosé, effervescent, liquoreux. */
export const GRAPE_WINE_COLOR_ORDER = [
  "white",
  "red",
  "rose",
  "sparkling",
  "liqueur",
] as const satisfies readonly WineColorKey[];

export type GrapeWineColor = (typeof GRAPE_WINE_COLOR_ORDER)[number];

type WinePctSource = {
  wine_pct_red: number | null;
  wine_pct_rose: number | null;
  wine_pct_white: number | null;
  wine_pct_sparkling: number | null;
  wine_pct_liqueur: number | null;
};

export type GrapeColorGroup<T> = {
  color: GrapeWineColor;
  main: T[];
  accessory: T[];
};

export function isGrapeWineColor(value: string | null | undefined): value is GrapeWineColor {
  return (
    value != null &&
    (GRAPE_WINE_COLOR_ORDER as readonly string[]).includes(value)
  );
}

/** Colors with a production share strictly above 0. */
export function producedGrapeColors(source: WinePctSource): GrapeWineColor[] {
  const breakdown = getWineColorBreakdown(source);
  if (!breakdown) return [];
  return GRAPE_WINE_COLOR_ORDER.filter((color) => breakdown[color] > 0);
}

type ClassifiedGrape = {
  is_primary: boolean;
  wine_color: string | null;
};

/**
 * Public fiche groups. Grapes with no color, or a color this AOP does not
 * produce, are omitted.
 */
export function groupPublicGrapesByColor<T extends ClassifiedGrape>(
  grapes: T[],
  produced: readonly GrapeWineColor[],
): GrapeColorGroup<T>[] {
  const allowed = new Set<string>(produced);
  return produced
    .map((color) => {
      const inColor = grapes.filter(
        (grape) => grape.wine_color === color && allowed.has(grape.wine_color),
      );
      return {
        color,
        main: inColor.filter((grape) => grape.is_primary),
        accessory: inColor.filter((grape) => !grape.is_primary),
      };
    })
    .filter((group) => group.main.length > 0 || group.accessory.length > 0);
}
