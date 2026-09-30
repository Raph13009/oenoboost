/** Grape radar axis helpers (Profil du cépage, scale 0–8). */

export const GRAPE_RADAR_MIN = 0;
export const GRAPE_RADAR_MAX = 8;

export type GrapeRadarFields = {
  radar_acidity: number | null;
  radar_body: number | null;
  radar_aromatic_intensity: number | null;
  radar_tannins: number | null;
  radar_alcohol_potential: number | null;
};

export const GRAPE_RADAR_KEYS = [
  "radar_acidity",
  "radar_body",
  "radar_aromatic_intensity",
  "radar_tannins",
  "radar_alcohol_potential",
] as const satisfies ReadonlyArray<keyof GrapeRadarFields>;

/** Empty / invalid → null. Integers outside 0–8 rejected. */
export function normalizeRadarAxis(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < GRAPE_RADAR_MIN || rounded > GRAPE_RADAR_MAX) return null;
  return rounded;
}

/** Returns FR error when any axis is set but outside 0–8. */
export function validateGrapeRadarFields(
  fields: GrapeRadarFields,
): string | null {
  for (const key of GRAPE_RADAR_KEYS) {
    const raw = fields[key];
    if (raw == null || raw === ("" as unknown)) continue;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      return "Les valeurs du profil du cépage doivent être des nombres entre 0 et 8.";
    }
    const rounded = Math.round(n);
    if (rounded < GRAPE_RADAR_MIN || rounded > GRAPE_RADAR_MAX) {
      return "Les valeurs du profil du cépage doivent être comprises entre 0 et 8.";
    }
  }
  return null;
}

export function normalizeGrapeRadarFields(
  fields: GrapeRadarFields,
): GrapeRadarFields {
  return {
    radar_acidity: normalizeRadarAxis(fields.radar_acidity),
    radar_body: normalizeRadarAxis(fields.radar_body),
    radar_aromatic_intensity: normalizeRadarAxis(fields.radar_aromatic_intensity),
    radar_tannins: normalizeRadarAxis(fields.radar_tannins),
    radar_alcohol_potential: normalizeRadarAxis(fields.radar_alcohol_potential),
  };
}
