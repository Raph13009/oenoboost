export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-bleed shell; page chrome lives inside LegalDocumentPage.
  return <>{children}</>;
}
