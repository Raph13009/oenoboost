/** Normalize a grape radar axis to the 0–8 display scale. Invalid → null. */
export function normalizeRadarValue(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 0 || rounded > 8) return null;
  return rounded;
}

export type GrapeRadarValues = {
  acidity: number | null;
  body: number | null;
  aromaticIntensity: number | null;
  tannins: number | null;
  alcoholPotential: number | null;
};

/** True when at least one axis has a usable 0–8 value. */
export function hasAnyRadarValue(values: GrapeRadarValues): boolean {
  return (
    values.acidity != null ||
    values.body != null ||
    values.aromaticIntensity != null ||
    values.tannins != null ||
    values.alcoholPotential != null
  );
}

/** Axes in chart order (top, then clockwise). Missing axes plot as 0. */
export function radarAxesForChart(values: GrapeRadarValues): number[] {
  return [
    values.acidity ?? 0,
    values.body ?? 0,
    values.aromaticIntensity ?? 0,
    values.tannins ?? 0,
    values.alcoholPotential ?? 0,
  ];
}
