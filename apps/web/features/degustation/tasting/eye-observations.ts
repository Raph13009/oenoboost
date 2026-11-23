/**
 * Encode / decode des observations œil stockées dans les varchar existants
 * (pas de migration) pour coller à la maquette Figma.
 *
 * eye_robe      → limpidité : limpid | slightly_cloudy | cloudy
 * eye_intensity → claire | medium | intense  (valeurs light|medium|intense)
 * eye_tears     → JSON { thickness, speed, colored }
 */

export type EyeLimpidity = "limpid" | "slightly_cloudy" | "cloudy";
export type EyeIntensity = "light" | "medium" | "intense";
export type TearThickness = "fine" | "thick";
export type TearSpeed = "fast" | "slow";
export type TearColored = "colored" | "uncolored";

export type EyeTearsValue = {
  thickness: TearThickness | null;
  speed: TearSpeed | null;
  colored: TearColored | null;
};

export function parseLimpidity(raw: string | null): EyeLimpidity | null {
  if (!raw) return null;
  if (raw === "limpid" || raw === "slightly_cloudy" || raw === "cloudy") return raw;
  // legacy robe
  if (raw === "pale") return "limpid";
  if (raw === "medium") return "slightly_cloudy";
  if (raw === "deep") return "cloudy";
  return null;
}

export function parseIntensity(raw: string | null): EyeIntensity | null {
  if (raw === "light" || raw === "medium" || raw === "intense") return raw;
  return null;
}

export function parseTears(raw: string | null): EyeTearsValue {
  const empty: EyeTearsValue = { thickness: null, speed: null, colored: null };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<EyeTearsValue>;
    return {
      thickness:
        parsed.thickness === "fine" || parsed.thickness === "thick"
          ? parsed.thickness
          : null,
      speed:
        parsed.speed === "fast" || parsed.speed === "slow" ? parsed.speed : null,
      colored:
        parsed.colored === "colored" || parsed.colored === "uncolored"
          ? parsed.colored
          : null,
    };
  } catch {
    // legacy single enum
    if (raw === "none") return { thickness: "fine", speed: "fast", colored: "uncolored" };
    if (raw === "light") return { thickness: "fine", speed: "slow", colored: "uncolored" };
    if (raw === "pronounced")
      return { thickness: "thick", speed: "slow", colored: "colored" };
    return empty;
  }
}

export function serializeTears(v: EyeTearsValue): string | null {
  if (!v.thickness && !v.speed && !v.colored) return null;
  return JSON.stringify(v);
}
