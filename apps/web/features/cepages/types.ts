export type { Grape } from "@/types/database";

export type RelatedGrape = {
  id: string;
  slug: string;
  name_fr: string;
  is_premium: boolean;
  /** true = main/classic ; false = accessory */
  is_primary: boolean;
};
