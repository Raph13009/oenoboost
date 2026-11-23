/**
 * Catalogue aromatique partagé Nez (#35) / Bouche (#36).
 * Source unique : roue Hortense fournie (contenu uniquement — pas d’UI roue).
 * Les taxonomies web (Nez du Vin, Ann Noble, etc.) ne sont PAS ajoutées ici.
 */

export type AromaFamilyId =
  | "empyreumatic"
  | "animal"
  | "spices"
  | "vegetal"
  | "fruity"
  | "floral"
  | "faults";

export type AromaId = string;

export type AromaItem = {
  id: AromaId;
  labelFr: string;
  labelEn: string;
};

export type AromaSubfamily = {
  id: string;
  labelFr: string;
  labelEn: string;
  aromas: AromaItem[];
};

export type AromaFamily = {
  id: AromaFamilyId;
  labelFr: string;
  labelEn: string;
  /** Accent colour for family card (Épure). */
  accent: string;
  subfamilies: AromaSubfamily[];
};

function a(id: string, fr: string, en: string): AromaItem {
  return { id, labelFr: fr, labelEn: en };
}

export const AROMA_FAMILIES: AromaFamily[] = [
  {
    id: "empyreumatic",
    labelFr: "Empyreumatique",
    labelEn: "Empyreumatic",
    accent: "#5c5854",
    subfamilies: [
      {
        id: "empyreumatic_main",
        labelFr: "Empyreumatique",
        labelEn: "Empyreumatic",
        aromas: [
          a("torrefie", "Torréfié", "Roasted"),
          a("pain_grille", "Pain grillé", "Toast"),
          a("silex", "Silex", "Flint"),
          a("pierre_fusil", "Pierre à fusil", "Gunflint"),
          a("cafe", "Café", "Coffee"),
          a("tabac", "Tabac", "Tobacco"),
          a("cacao", "Cacao", "Cocoa"),
        ],
      },
    ],
  },
  {
    id: "animal",
    labelFr: "Animal",
    labelEn: "Animal",
    accent: "#6b5344",
    subfamilies: [
      {
        id: "animal_main",
        labelFr: "Animal",
        labelEn: "Animal",
        aromas: [
          a("ambre_gris", "Ambre gris", "Ambergris"),
          a("musc", "Musc", "Musk"),
          a("cuir", "Cuir", "Leather"),
          a("gibier", "Gibier", "Game"),
          a("fourrure", "Fourrure", "Fur"),
          a("venaison", "Venaison", "Venison"),
        ],
      },
    ],
  },
  {
    id: "spices",
    labelFr: "Épices aromates",
    labelEn: "Spices & herbs",
    accent: "#9a7b4f",
    subfamilies: [
      {
        id: "spices_main",
        labelFr: "Épices aromates",
        labelEn: "Spices & aromatics",
        aromas: [
          a("thym", "Thym", "Thyme"),
          a("laurier", "Laurier", "Bay leaf"),
          a("basilic", "Basilic", "Basil"),
          a("girofle", "Girofle", "Clove"),
          a("poivre", "Poivre", "Pepper"),
          a("menthe", "Menthe", "Mint"),
          a("cannelle", "Cannelle", "Cinnamon"),
          a("reglisse", "Réglisse", "Liquorice"),
          a("vanille", "Vanille", "Vanilla"),
          a("muscade", "Muscade", "Nutmeg"),
          a("miel", "Miel", "Honey"),
        ],
      },
    ],
  },
  {
    id: "vegetal",
    labelFr: "Végétal",
    labelEn: "Vegetal",
    accent: "#4f6b3f",
    subfamilies: [
      {
        id: "vegetal_herbs",
        labelFr: "Plantes",
        labelEn: "Herbs",
        aromas: [
          a("tilleul", "Tilleul", "Linden"),
          a("verveine", "Verveine", "Verbena"),
          a("citronnelle", "Citronnelle", "Lemongrass"),
        ],
      },
      {
        id: "vegetal_bois",
        labelFr: "Bois",
        labelEn: "Wood",
        aromas: [
          a("sous_bois", "Sous-bois", "Undergrowth"),
          a("feuille_morte", "Feuille morte", "Dead leaf"),
          a("mousse_chene", "Mousse de chêne", "Oak moss"),
          a("fougere", "Fougère", "Fern"),
          a("herbace", "Herbacé", "Herbaceous"),
          a("foin_frais", "Foin frais", "Fresh hay"),
          a("champignon", "Champignon", "Mushroom"),
          a("truffe", "Truffe", "Truffle"),
          a("resine", "Résine", "Resin"),
          a("pin", "Pin", "Pine"),
          a("cedre", "Cèdre", "Cedar"),
          a("chene", "Chêne", "Oak"),
        ],
      },
    ],
  },
  {
    id: "fruity",
    labelFr: "Fruité",
    labelEn: "Fruity",
    accent: "#a04a4a",
    subfamilies: [
      {
        id: "fruits_rouges",
        labelFr: "Fruits rouges",
        labelEn: "Red fruits",
        aromas: [
          a("cassis", "Cassis", "Blackcurrant"),
          a("framboise", "Framboise", "Raspberry"),
          a("mure", "Mûre", "Blackberry"),
          a("fraise", "Fraise", "Strawberry"),
        ],
      },
      {
        id: "fruits_noyaux",
        labelFr: "Fruits à noyaux",
        labelEn: "Stone fruits",
        aromas: [
          a("cerise", "Cerise", "Cherry"),
          a("peche", "Pêche", "Peach"),
          a("abricot", "Abricot", "Apricot"),
          a("prune", "Prune", "Plum"),
        ],
      },
      {
        id: "fruits_pepins",
        labelFr: "Fruits à pépins",
        labelEn: "Pome fruits",
        aromas: [
          a("pomme", "Pomme", "Apple"),
          a("poire", "Poire", "Pear"),
          a("muscat", "Muscat", "Muscat"),
        ],
      },
      {
        id: "fruits_exotiques",
        labelFr: "Fruits exotiques",
        labelEn: "Exotic fruits",
        aromas: [
          a("banane", "Banane", "Banana"),
          a("orange", "Orange", "Orange"),
          a("citron", "Citron", "Lemon"),
          a("ananas", "Ananas", "Pineapple"),
          a("pamplemousse", "Pamplemousse", "Grapefruit"),
        ],
      },
      {
        id: "fruits_secs",
        labelFr: "Fruits secs",
        labelEn: "Dried fruits",
        aromas: [
          a("noisette", "Noisette", "Hazelnut"),
          a("amande", "Amande", "Almond"),
          a("noix", "Noix", "Walnut"),
          a("figue", "Figue", "Fig"),
          a("pruneau", "Pruneau", "Prune"),
          a("raisin_sec", "Raisin sec", "Raisin"),
        ],
      },
    ],
  },
  {
    id: "floral",
    labelFr: "Floral",
    labelEn: "Floral",
    accent: "#9a5f7a",
    subfamilies: [
      {
        id: "floral_main",
        labelFr: "Floral",
        labelEn: "Floral",
        aromas: [
          a("acacia", "Acacia", "Acacia"),
          a("aubepine", "Aubépine", "Hawthorn"),
          a("chevrefeuille", "Chèvrefeuille", "Honeysuckle"),
          a("oeillet", "Œillet", "Carnation"),
          a("jacinthe", "Jacinthe", "Hyacinth"),
          a("jasmin", "Jasmin", "Jasmine"),
          a("giroflee", "Giroflée", "Wallflower"),
          a("fleur_oranger", "Fleur d’oranger", "Orange blossom"),
          a("iris", "Iris", "Iris"),
          a("pivoine", "Pivoine", "Peony"),
          a("rose", "Rose", "Rose"),
          a("violette", "Violette", "Violet"),
        ],
      },
    ],
  },
  {
    id: "faults",
    labelFr: "Défauts",
    labelEn: "Faults",
    accent: "#5a7a8a",
    subfamilies: [
      {
        id: "faults_chimique",
        labelFr: "Chimique",
        labelEn: "Chemical",
        aromas: [
          a("bouchon", "Bouchon", "Corked"),
          a("moisi", "Moisi", "Musty"),
          a("pourri", "Pourri", "Rotten"),
          a("acetique", "Acétique", "Acetic"),
          a("soufre", "Soufre", "Sulfur"),
          a("ethanol", "Éthanol", "Ethanol"),
        ],
      },
    ],
  },
];

const AROMA_BY_ID: Record<string, AromaItem> = {};
for (const fam of AROMA_FAMILIES) {
  for (const sub of fam.subfamilies) {
    for (const aroma of sub.aromas) {
      AROMA_BY_ID[aroma.id] = aroma;
    }
  }
}

export function getAromaById(id: string): AromaItem | undefined {
  return AROMA_BY_ID[id];
}

export function aromaLabel(id: string, locale: "fr" | "en" = "fr"): string {
  const hit = AROMA_BY_ID[id];
  if (!hit) return id;
  return locale === "en" ? hit.labelEn : hit.labelFr;
}

export function allAromaIds(): string[] {
  return Object.keys(AROMA_BY_ID);
}

export function isAromaId(id: string): boolean {
  return id in AROMA_BY_ID;
}

/** Legacy nose family chips from before #35/#36 — map if still present in drafts. */
export const LEGACY_NOSE_FAMILY_MAP: Record<string, AromaFamilyId> = {
  Fruity: "fruity",
  Floral: "floral",
  Spicy: "spices",
  Woody: "vegetal",
  Mineral: "empyreumatic",
  Vegetal: "vegetal",
  Fermented: "faults",
};
