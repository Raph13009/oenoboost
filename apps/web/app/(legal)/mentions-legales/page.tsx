import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getLegalBundle, getLegalDocument } from "@/content/legal";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = getLegalDocument(locale, "mentions");
  return { title: doc.title };
}

export default async function MentionsLegalesPage() {
  const locale = await getServerLocale();
  const bundle = getLegalBundle(locale);
  const document = getLegalDocument(locale, "mentions");

  return (
    <LegalDocumentPage document={document} bundle={bundle} active="mentions" />
  );
}
