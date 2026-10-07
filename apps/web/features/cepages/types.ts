export type { Grape } from "@/types/database";

export type RelatedGrape = {
  id: string;
  slug: string;
  name_fr: string;
  is_premium: boolean;
  /** true = main/classic ; false = accessory */
  is_primary: boolean;
  /** null = not classified; hidden on the public fiche */
  wine_color: "white" | "red" | "rose" | "sparkling" | "liqueur" | null;
};

/** Emblematic AOP chip target on the grape fiche. */
export type EmblematicAop = {
  id: number;
  slug: string;
  name: string;
  region_slug: string;
  subregion_slug: string;
};
