/**
 * Palettes robe / reflets — Hortense « Partie Dégustation » PDF (#34).
 * Affichées uniquement selon le type de vin choisi à l’identité.
 */

export type WineTypeId = "white" | "red" | "rose";

export type WineColorId =
  | "pale_yellow"
  | "lemon_yellow"
  | "golden_yellow"
  | "pale_gold"
  | "intense_gold"
  | "light_amber"
  | "ruby"
  | "garnet"
  | "purple"
  | "violet"
  | "tawny"
  | "mahogany"
  | "pale_rose"
  | "salmon_rose"
  | "peach_rose"
  | "raspberry_rose"
  | "deep_rose"
  | "orange_rose"
  // legacy ids kept for history hex lookup
  | "amber"
  | "salmon"
  | "gold"
  | "pale_lemon"
  | "lemon"
  | "pale_pink"
  | "deep_pink";

export type WineShade = {
  id: WineColorId;
  hex: string;
  labelKey: string;
};

export const WINE_TYPE_PALETTES: Record<WineTypeId, WineShade[]> = {
  white: [
    { id: "pale_yellow", hex: "#F3E9B0", labelKey: "colorPaleYellow" },
    { id: "lemon_yellow", hex: "#E8D45A", labelKey: "colorLemonYellow" },
    { id: "golden_yellow", hex: "#D4B84A", labelKey: "colorGoldenYellow" },
    { id: "pale_gold", hex: "#C9A23A", labelKey: "colorPaleGold" },
    { id: "intense_gold", hex: "#B8892E", labelKey: "colorIntenseGold" },
    { id: "light_amber", hex: "#A66B2A", labelKey: "colorLightAmber" },
  ],
  red: [
    { id: "ruby", hex: "#9B273F", labelKey: "colorRuby" },
    { id: "garnet", hex: "#732833", labelKey: "colorGarnet" },
    { id: "purple", hex: "#72223C", labelKey: "colorPurple" },
    { id: "violet", hex: "#592247", labelKey: "colorViolet" },
    { id: "tawny", hex: "#A94F38", labelKey: "colorTawny" },
    { id: "mahogany", hex: "#6B3A2A", labelKey: "colorMahogany" },
  ],
  rose: [
    { id: "pale_rose", hex: "#F6DDD2", labelKey: "colorPaleRose" },
    { id: "salmon_rose", hex: "#E4A68B", labelKey: "colorSalmonRose" },
    { id: "peach_rose", hex: "#EFB49F", labelKey: "colorPeachRose" },
    { id: "raspberry_rose", hex: "#D16B7B", labelKey: "colorRaspberryRose" },
    { id: "deep_rose", hex: "#C85A6E", labelKey: "colorDeepRose" },
    { id: "orange_rose", hex: "#D18B7B", labelKey: "colorOrangeRose" },
  ],
};

const LEGACY_HEX: Record<string, string> = {
  amber: "#9e6425",
  salmon: "#e4a68b",
  gold: "#caa744",
  pale_lemon: "#F5E6C8",
  lemon: "#E8D48A",
  pale_pink: "#F5D0D5",
  deep_pink: "#C85A6E",
};

export function colorsForWineType(wineType: WineTypeId): WineShade[] {
  return WINE_TYPE_PALETTES[wineType];
}

export function isColorCompatibleWithWineType(
  colorId: string | null | undefined,
  wineType: WineTypeId | null | undefined,
): boolean {
  if (!colorId || !wineType) return false;
  return WINE_TYPE_PALETTES[wineType].some((c) => c.id === colorId);
}

export function getHexForEyeColorId(id: string | null): string {
  if (!id) return "rgba(0,0,0,0.08)";
  for (const shades of Object.values(WINE_TYPE_PALETTES)) {
    const hit = shades.find((c) => c.id === id);
    if (hit) return hit.hex;
  }
  return LEGACY_HEX[id] ?? "rgba(0,0,0,0.12)";
}

export function isWineColorId(s: string | null): s is WineColorId {
  if (!s) return false;
  if (LEGACY_HEX[s]) return true;
  return Object.values(WINE_TYPE_PALETTES).some((shades) =>
    shades.some((c) => c.id === s),
  );
}

export function colorLabelKey(id: WineColorId): string {
  for (const shades of Object.values(WINE_TYPE_PALETTES)) {
    const hit = shades.find((c) => c.id === id);
    if (hit) return hit.labelKey;
  }
  return id;
}

export function isWineTypeId(s: string | null | undefined): s is WineTypeId {
  return s === "white" || s === "red" || s === "rose";
}

/** @deprecated Prefer WINE_TYPE_PALETTES / colorsForWineType */
export const EPURE_EYE_COLORS = WINE_TYPE_PALETTES.red.map((c) => ({
  id: c.id,
  hex: c.hex,
  asset: "",
  labelKey: c.labelKey,
}));

/** @deprecated */
export const WINE_COLOR_GROUPS = [
  {
    groupKey: "groupRed" as const,
    colors: WINE_TYPE_PALETTES.red.map(({ id, hex }) => ({ id, hex })),
  },
];
