/** Identifiants stables en `eye_color` (varchar). Palette Figma Épure + legacy. */
export type WineColorId =
  | "violet"
  | "purple"
  | "ruby"
  | "garnet"
  | "tawny"
  | "amber"
  // legacy
  | "green_yellow"
  | "straw"
  | "pale_gold"
  | "gold"
  | "deep_gold"
  | "raspberry"
  | "cherry"
  | "petal"
  | "lychee"
  | "peach"
  | "salmon"
  | "apricot"
  | "copper"
  | "pale_lemon"
  | "lemon"
  | "pale_pink"
  | "deep_pink";

/** Palette exacte Figma Épure — Visuel (6 teintes). */
export const EPURE_EYE_COLORS: {
  id: WineColorId;
  hex: string;
  asset: string;
  labelKey:
    | "colorViolet"
    | "colorPurple"
    | "colorRuby"
    | "colorGarnet"
    | "colorTawny"
    | "colorAmber";
}[] = [
  {
    id: "violet",
    hex: "#592247",
    asset: "/tasting/epure/color-violace.svg",
    labelKey: "colorViolet",
  },
  {
    id: "purple",
    hex: "#72223C",
    asset: "/tasting/epure/color-pourpre.svg",
    labelKey: "colorPurple",
  },
  {
    id: "ruby",
    hex: "#9B273F",
    asset: "/tasting/epure/color-rubis.svg",
    labelKey: "colorRuby",
  },
  {
    id: "garnet",
    hex: "#732833",
    asset: "/tasting/epure/color-grenat.svg",
    labelKey: "colorGarnet",
  },
  {
    id: "tawny",
    hex: "#A94F38",
    asset: "/tasting/epure/color-tuile.svg",
    labelKey: "colorTawny",
  },
  {
    id: "amber",
    hex: "#B7793F",
    asset: "/tasting/epure/color-ambre.svg",
    labelKey: "colorAmber",
  },
];

/** @deprecated kept for history / older drafts — use EPURE_EYE_COLORS for Œil UI */
export const WINE_COLOR_GROUPS: {
  groupKey: "groupWhite" | "groupRose" | "groupRed";
  colors: { id: WineColorId; hex: string }[];
}[] = [
  {
    groupKey: "groupRed",
    colors: EPURE_EYE_COLORS.map(({ id, hex }) => ({ id, hex })),
  },
];

const ALL_HEX: Record<string, string> = Object.fromEntries(
  EPURE_EYE_COLORS.map((c) => [c.id, c.hex]),
);

export function getHexForEyeColorId(id: string | null): string {
  if (!id) return "rgba(0,0,0,0.08)";
  return ALL_HEX[id] ?? "rgba(0,0,0,0.12)";
}

export function isWineColorId(s: string | null): s is WineColorId {
  if (!s) return false;
  return EPURE_EYE_COLORS.some((c) => c.id === s) || s in ALL_HEX;
}

export function colorLabelKey(id: WineColorId): string {
  const map: Partial<Record<WineColorId, string>> = {
    violet: "colorViolet",
    purple: "colorPurple",
    ruby: "colorRuby",
    garnet: "colorGarnet",
    tawny: "colorTawny",
    amber: "colorAmber",
  };
  return map[id] ?? id;
}
