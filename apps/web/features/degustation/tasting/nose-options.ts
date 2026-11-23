/** Options nez — Hortense PDF « Partie Dégustation » pp.1–2 (#35). */

export const NOSE_INTENSITY_OPTIONS = [
  { id: "light", labelKey: "noseIntLow" as const },
  { id: "medium", labelKey: "noseIntMid" as const },
  { id: "pronounced", labelKey: "noseIntHigh" as const },
] as const;

export type NoseIntensityId = (typeof NOSE_INTENSITY_OPTIONS)[number]["id"];

export const NOSE_PLUS_OPTIONS = [
  { id: "plaisant", labelKey: "nosePlusPlaisant" as const },
  { id: "agreable", labelKey: "nosePlusAgreable" as const },
  { id: "appetant", labelKey: "nosePlusAppetant" as const },
  { id: "elegant", labelKey: "nosePlusElegant" as const },
  { id: "race", labelKey: "nosePlusRace" as const },
  { id: "simpliste", labelKey: "nosePlusSimpliste" as const },
  { id: "rustique", labelKey: "nosePlusRustique" as const },
  { id: "ferme", labelKey: "nosePlusFerme" as const },
] as const;

export type NosePlusId = (typeof NOSE_PLUS_OPTIONS)[number]["id"];

export function isNosePlusId(s: string | null | undefined): s is NosePlusId {
  return NOSE_PLUS_OPTIONS.some((o) => o.id === s);
}
