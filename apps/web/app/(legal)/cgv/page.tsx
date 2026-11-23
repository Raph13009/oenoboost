import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getLegalBundle, getLegalDocument } from "@/content/legal";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = getLegalDocument(locale, "cgv");
  return { title: doc.title };
}

export default async function CgvPage() {
  const locale = await getServerLocale();
  const bundle = getLegalBundle(locale);
  const document = getLegalDocument(locale, "cgv");

  return <LegalDocumentPage document={document} bundle={bundle} active="cgv" />;
}
