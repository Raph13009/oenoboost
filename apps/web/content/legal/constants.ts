/** Shared legal / RGPD contact facts — do not invent SIREN or company form. */
export const LEGAL_PUBLISHER = {
  name: "Hortense Chevalier",
  addressLines: ["34 Rue de l'Arène", "13260 Cassis", "France"],
  addressSingleLine: "34 Rue de l'Arène, 13260 Cassis, France",
  email: "chevalier.ho48@gmail.com",
  siteName: "OenoBoost",
} as const;

export const LEGAL_HOSTING = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
  website: "https://vercel.com",
} as const;

/**
 * RGPD / account-deletion contact — hardcoded so prod works without a
 * Vercel env (no dashboard access required).
 */
export const DEFAULT_ACCOUNT_DELETE_EMAIL = LEGAL_PUBLISHER.email;

export function getAccountDeleteEmail(): string {
  return DEFAULT_ACCOUNT_DELETE_EMAIL;
}

export function buildRightsMailto(kind: "delete" | "access" | "export"): string {
  const email = getAccountDeleteEmail();
  const subjects = {
    delete: "Demande de suppression de compte OenoBoost",
    access: "Demande d'accès à mes données personnelles OenoBoost",
    export: "Demande d'export de mes données personnelles OenoBoost",
  } as const;
  const bodies = {
    delete:
      "Bonjour,\n\nJe souhaite supprimer mon compte OenoBoost et les données personnelles associées.\nAdresse email du compte :\n\nCordialement,",
    access:
      "Bonjour,\n\nJe souhaite exercer mon droit d'accès à mes données personnelles sur OenoBoost.\nAdresse email du compte :\n\nCordialement,",
    export:
      "Bonjour,\n\nJe souhaite recevoir une copie / un export de mes données personnelles OenoBoost.\nAdresse email du compte :\n\nCordialement,",
  } as const;
  return `mailto:${email}?subject=${encodeURIComponent(subjects[kind])}&body=${encodeURIComponent(bodies[kind])}`;
}
