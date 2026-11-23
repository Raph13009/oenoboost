/** Options bouche — Hortense PDF « Partie Dégustation » pp.2–3 (#36). */

export const MOUTH_ATTACK_OPTIONS = [
  { id: "discrete", labelKey: "attackDiscrete" as const },
  { id: "souple", labelKey: "attackSouple" as const },
  { id: "ample", labelKey: "attackAmple" as const },
  { id: "ronde", labelKey: "attackRonde" as const },
  { id: "franche", labelKey: "attackFranche" as const },
  { id: "vive", labelKey: "attackVive" as const },
  { id: "agressive", labelKey: "attackAgressive" as const },
] as const;

export type MouthAttackId = (typeof MOUTH_ATTACK_OPTIONS)[number]["id"];

export const MOUTH_TEXTURE_OPTIONS = [
  { id: "douce", labelKey: "textureDouce" as const },
  { id: "soyeuse", labelKey: "textureSoyeuse" as const },
  { id: "veloutee", labelKey: "textureVeloutee" as const },
  { id: "enveloppante", labelKey: "textureEnveloppante" as const },
  { id: "desalterante", labelKey: "textureDesalterante" as const },
  { id: "legere", labelKey: "textureLegere" as const },
  { id: "cristalline", labelKey: "textureCristalline" as const },
  { id: "concentree", labelKey: "textureConcentree" as const },
  { id: "charnue", labelKey: "textureCharnue" as const },
  { id: "tannique", labelKey: "textureTannique" as const },
  { id: "assechante", labelKey: "textureAssechante" as const },
] as const;

export type MouthTextureId = (typeof MOUTH_TEXTURE_OPTIONS)[number]["id"];

export const MOUTH_FINISH_OPTIONS = [
  { id: "short", labelKey: "finishShort" as const },
  { id: "medium", labelKey: "finishMedium" as const },
  { id: "long", labelKey: "finishLong" as const },
] as const;

export type MouthFinishId = (typeof MOUTH_FINISH_OPTIONS)[number]["id"];

export function isMouthAttackId(s: string | null | undefined): s is MouthAttackId {
  return MOUTH_ATTACK_OPTIONS.some((o) => o.id === s);
}

export function isMouthTextureId(
  s: string | null | undefined,
): s is MouthTextureId {
  return MOUTH_TEXTURE_OPTIONS.some((o) => o.id === s);
}
