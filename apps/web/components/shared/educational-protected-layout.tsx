import { ProtectedContent } from "@/components/shared/protected-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";

/**
 * Shared shell for CMS educational modules (Issue #39 copy deterrence).
 */
export async function EducationalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  return (
    <ProtectedContent message={dict.common.copyProtected}>
      {children}
    </ProtectedContent>
  );
}
