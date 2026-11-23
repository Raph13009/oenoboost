export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: "mentions-legales" | "cgv" | "confidentialite";
  title: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
};
