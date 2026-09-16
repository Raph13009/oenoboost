/** Wine color breakdown columns on `public.aop`. */
export type WineColorBreakdown = {
  wine_pct_red: number | null;
  wine_pct_rose: number | null;
  wine_pct_white: number | null;
  wine_pct_sparkling: number | null;
  wine_pct_liqueur: number | null;
};

export const WINE_COLOR_LABELS = {
  red: "Vin rouge",
  rose: "Vin rosé",
  white: "Vin blanc",
  sparkling: "Vin effervescent",
  liqueur: "Vin liquoreux",
} as const;

export const WINE_COLOR_CHART_COLORS = {
  red: "#7C2736",
  rose: "#d98a96",
  white: "#f5f0e8",
  sparkling: "#5b8a9a",
  liqueur: "#c4a574",
} as const;

export function hasWineColorBreakdownData(pct: WineColorBreakdown): boolean {
  return (
    pct.wine_pct_red != null ||
    pct.wine_pct_rose != null ||
    pct.wine_pct_white != null ||
    pct.wine_pct_sparkling != null ||
    pct.wine_pct_liqueur != null
  );
}

export function wineColorBreakdownTotal(pct: WineColorBreakdown): number {
  return (
    (pct.wine_pct_red ?? 0) +
    (pct.wine_pct_rose ?? 0) +
    (pct.wine_pct_white ?? 0) +
    (pct.wine_pct_sparkling ?? 0) +
    (pct.wine_pct_liqueur ?? 0)
  );
}

export function emptyWineColorBreakdown(): WineColorBreakdown {
  return {
    wine_pct_red: null,
    wine_pct_rose: null,
    wine_pct_white: null,
    wine_pct_sparkling: null,
    wine_pct_liqueur: null,
  };
}

export function clampWinePct(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

const WINE_COLOR_FIELDS: Array<keyof WineColorBreakdown> = [
  "wine_pct_red",
  "wine_pct_rose",
  "wine_pct_white",
  "wine_pct_sparkling",
  "wine_pct_liqueur",
];

/** Apply one editor change, keeping the total at 100% maximum. */
export function applyWineColorPctChange(
  current: WineColorBreakdown,
  field: keyof WineColorBreakdown,
  raw: number,
): WineColorBreakdown {
  const next: WineColorBreakdown = { ...current, [field]: clampWinePct(raw) };
  let overflow = wineColorBreakdownTotal(next) - 100;
  if (overflow <= 0) return next;

  for (const other of WINE_COLOR_FIELDS) {
    if (other === field) continue;
    if (overflow <= 0) break;
    const currentOther = next[other] ?? 0;
    if (currentOther <= 0) continue;
    const reduction = Math.min(currentOther, overflow);
    next[other] = currentOther - reduction;
    overflow -= reduction;
  }

  return next;
}

/** Validates breakdown before save. Returns an error message or null if OK. */
export function validateWineColorBreakdown(pct: WineColorBreakdown): string | null {
  if (!hasWineColorBreakdownData(pct)) return null;

  for (const field of WINE_COLOR_FIELDS) {
    const value = pct[field];
    if (value === null || value === undefined) {
      return "Renseignez les cinq pourcentages ou activez « Données non renseignées ».";
    }
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return "Chaque pourcentage doit être un entier entre 0 et 100.";
    }
  }

  if (wineColorBreakdownTotal(pct) > 100) {
    return "La somme des pourcentages ne peut pas dépasser 100 %.";
  }

  return null;
}
