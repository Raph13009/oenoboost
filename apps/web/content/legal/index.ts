import type { Locale } from "@/lib/i18n/config";

import { legalEn } from "./en";
import { legalFr } from "./fr";
import type { LegalDocument } from "./types";

export {
  DEFAULT_ACCOUNT_DELETE_EMAIL,
  LEGAL_HOSTING,
  LEGAL_PUBLISHER,
  buildRightsMailto,
  getAccountDeleteEmail,
} from "./constants";
export type { LegalDocument, LegalSection } from "./types";

export type LegalBundle = typeof legalFr;

const bundles: Record<Locale, LegalBundle> = {
  fr: legalFr,
  en: legalEn as unknown as LegalBundle,
};

export function getLegalBundle(locale: Locale): LegalBundle {
  return bundles[locale] ?? legalFr;
}

export function getLegalDocument(
  locale: Locale,
  key: "mentions" | "cgv" | "privacy",
): LegalDocument {
  return getLegalBundle(locale).documents[key];
}
