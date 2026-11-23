import { describe, expect, it } from "vitest";

import frDict from "@/lib/i18n/dictionaries/fr";
import enDict from "@/lib/i18n/dictionaries/en";

import {
  DEFAULT_ACCOUNT_DELETE_EMAIL,
  LEGAL_PUBLISHER,
  buildRightsMailto,
  getLegalDocument,
} from "./index";

describe("legal content", () => {
  it("identifies Hortense as natural person publisher without inventing SIREN", () => {
    expect(LEGAL_PUBLISHER.name).toBe("Hortense Chevalier");
    expect(LEGAL_PUBLISHER.email).toBe("chevalier.ho48@gmail.com");
    expect(DEFAULT_ACCOUNT_DELETE_EMAIL).toBe(LEGAL_PUBLISHER.email);

    for (const locale of ["fr", "en"] as const) {
      const mentions = getLegalDocument(locale, "mentions");
      const joined = mentions.sections
        .flatMap((s) => s.paragraphs)
        .join(" ");
      expect(joined).toContain(LEGAL_PUBLISHER.name);
      expect(joined.toLowerCase()).toMatch(/siren|siret/);
      expect(joined).not.toMatch(/\b\d{9}\b.*SIREN|SIREN.*\b\d{9}\b/);
    }
  });

  it("privacy policy lists processors and Stripe card boundary", () => {
    const privacy = getLegalDocument("fr", "privacy");
    const text = [
      ...privacy.sections.flatMap((s) => s.paragraphs),
      ...privacy.sections.flatMap((s) => s.bullets ?? []),
    ].join(" ");
    expect(text).toMatch(/Supabase/);
    expect(text).toMatch(/Stripe/);
    expect(text).toMatch(/Mapbox/);
    expect(text).toMatch(/Vercel/);
    expect(text.toLowerCase()).toMatch(/carte/);
  });

  it("delete account copy mentions Stripe retention", () => {
    expect(frDict.profile.deleteAccountBody).toMatch(/Stripe/);
    expect(frDict.profile.deleteAccountBody).toMatch(/30 jours/);
    expect(enDict.profile.deleteAccountBody).toMatch(/Stripe/);
    expect(enDict.profile.deleteAccountBody).toMatch(/30 business days/);
  });

  it("buildRightsMailto targets the delete contact", () => {
    const href = buildRightsMailto("delete");
    expect(href.startsWith(`mailto:${DEFAULT_ACCOUNT_DELETE_EMAIL}?`)).toBe(
      true,
    );
    expect(href).toMatch(/subject=/);
  });
});
