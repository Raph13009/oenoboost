import type { TastingSheetInsert } from "@/types/database";
import type { WineTypeId } from "@/features/degustation/tasting/wine-colors";

/** Brouillon UI (millésime saisi en string, converti en nombre à l’enregistrement). */
export type TastingDraft = Omit<
  TastingSheetInsert,
  "wine_name" | "vintage" | "wine_type"
> & {
  wine_name: string;
  vintage: string;
  wine_type: WineTypeId | null;
  /** Affiché dans la carte « Dans votre verre » (session only). */
  wine_origin: string;
};

export function createEmptyTastingDraft(): TastingDraft {
  return {
    wine_name: "",
    vintage: "",
    wine_origin: "",
    wine_type: null,
    eye_color: null,
    eye_reflets: null,
    eye_robe: null,
    eye_intensity: null,
    eye_tears: null,
    eye_notes: null,
    nose_first_nose: null,
    nose_second_nose: null,
    nose_aroma_families: [],
    nose_intensity: null,
    nose_notes: null,
    mouth_attack: null,
    mouth_mid: null,
    mouth_finish: null,
    mouth_acidity: 5,
    mouth_tannins: 5,
    mouth_alcohol: 5,
    mouth_sugar: 5,
    mouth_length_caudalie: 5,
    mouth_notes: null,
  };
}

export function draftToInsert(d: TastingDraft): TastingSheetInsert & {
  wine_name: string | null;
  vintage: number | null;
} {
  const v = d.vintage.trim();
  const year = v ? parseInt(v, 10) : NaN;
  return {
    wine_name: d.wine_name.trim() || null,
    vintage: Number.isFinite(year) ? year : null,
    wine_type: d.wine_type,
    eye_color: d.eye_color,
    eye_reflets: d.eye_reflets,
    eye_robe: d.eye_robe,
    eye_intensity: d.eye_intensity,
    eye_tears: d.eye_tears,
    eye_notes: d.eye_notes,
    nose_first_nose: d.nose_first_nose,
    nose_second_nose: d.nose_second_nose,
    nose_aroma_families: d.nose_aroma_families ?? [],
    nose_intensity: d.nose_intensity,
    nose_notes: d.nose_notes,
    mouth_attack: d.mouth_attack,
    mouth_mid: d.mouth_mid,
    mouth_finish: d.mouth_finish,
    mouth_acidity: d.mouth_acidity,
    mouth_tannins: d.mouth_tannins,
    mouth_alcohol: d.mouth_alcohol,
    mouth_sugar: d.mouth_sugar,
    mouth_length_caudalie: d.mouth_length_caudalie,
    mouth_notes: d.mouth_notes,
  };
}

export const STORAGE_KEY = "oenoboost-tasting-draft-v2";
