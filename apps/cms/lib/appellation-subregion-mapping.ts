type SimpleAppellation = {
  id: string;
  slug: string;
  name_fr: string;
};

type SimpleSubregion = {
  id: string;
  slug: string;
  name_fr: string;
  region_id: string;
  region_name_fr?: string | null;
};

const MANUAL_SUBREGION_APPELLATIONS: Record<string, string[]> = {
  "blaye-bourg": ["blaye", "blaye-cotes-de-bordeaux", "cotes-de-bourg"],
  "entre-deux-mers": [
    "entre-deux-mers",
    "entre-deux-mers-haut-benauge",
    "bordeaux-haut-benauge",
    "graves-de-vayres",
    "sainte-foy-bordeaux",
  ],
  "graves-sauternais": [
    "barsac",
    "cadillac",
    "cadillac-cotes-de-bordeaux",
    "cerons",
    "cotes-de-bordeaux-saint-macaire",
    "graves",
    "graves-superieures",
    "loupiac",
    "pessac-leognan",
    "premieres-cotes-de-bordeaux",
    "sainte-croix-du-mont",
    "sauternes",
  ],
  "libournais-rive-droite": [
    "canon-fronsac",
    "castillon-cotes-de-bordeaux",
    "francs-cotes-de-bordeaux",
    "fronsac",
    "lalande-de-pomerol",
    "pomerol",
    "saint-emilion",
    "saint-emilion-grand-cru",
  ],
  medoc: [
    "haut-medoc",
    "listrac-medoc",
    "margaux",
    "medoc",
    "moulis-en-medoc",
    "pauillac",
    "saint-estephe",
    "saint-julien",
  ],
  "bordeaux-regionales": ["bordeaux", "bordeaux-superieur", "cremant-de-bordeaux"],
  "rhone-nord": [
    "chateau-grillet",
    "condrieu",
    "cornas",
    "cote-rotie",
    "crozes-hermitage",
    "hermitage",
    "saint-joseph",
    "saint-peray",
  ],
  "rhone-sud": [
    "beaumes-de-venise",
    "cairanne",
    "chateauneuf-du-pape",
    "diois",
    "duche-duzes",
    "gigondas",
    "grignan-les-adhemar",
    "lirac",
    "luberon",
    "muscat-beaumes-de-venise",
    "rasteau",
    "rasteau-vdn",
    "tavel",
    "vacqueyras",
    "ventoux",
    "vinsobres",
  ],
};

export function normalizeComparable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isManualMatch(appellationSlug: string, subregionSlug: string): boolean {
  return (MANUAL_SUBREGION_APPELLATIONS[subregionSlug] ?? []).includes(appellationSlug);
}

export function doesAppellationBelongToSubregion(
  appellation: SimpleAppellation,
  subregion: SimpleSubregion
): boolean {
  const appellationSlug = normalizeComparable(appellation.slug || appellation.name_fr);
  const appellationName = normalizeComparable(appellation.name_fr);
  const subregionSlug = normalizeComparable(subregion.slug || subregion.name_fr);
  const subregionName = normalizeComparable(subregion.name_fr);

  return (
    appellationSlug === subregionSlug ||
    appellationName === subregionSlug ||
    appellationSlug === subregionName ||
    isManualMatch(appellationSlug, subregionSlug)
  );
}

export function findSubregionForAppellation<T extends SimpleSubregion>(
  appellation: SimpleAppellation,
  subregions: T[]
): T | null {
  return subregions.find((subregion) => doesAppellationBelongToSubregion(appellation, subregion)) ?? null;
}

export function listAppellationsForSubregion<T extends SimpleAppellation>(
  subregion: SimpleSubregion,
  appellations: T[]
): T[] {
  return appellations.filter((appellation) => doesAppellationBelongToSubregion(appellation, subregion));
}
