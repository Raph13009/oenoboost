import { MouthTastingClient } from "@/features/degustation/components/tasting/mouth-tasting-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  return {
    title: `${dict.tastingFlow.stepMouth} — OenoBoost`,
  };
}

type PageProps = {
  searchParams: Promise<{ save?: string }>;
};

export default async function TastingMouthStartPage({ searchParams }: PageProps) {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  const user = await getCurrentUser();
  const sp = await searchParams;
  const d = dict.degustation;

  return (
    <MouthTastingClient
      labels={dict.tastingFlow}
      locale={locale === "en" ? "en" : "fr"}
      isLoggedIn={user != null}
      autoSaveAfterAuth={sp.save === "1" && user != null}
      authCopy={{
        title: d.authModalTitle,
        body: d.authModalBody,
        login: dict.auth.login,
        register: dict.auth.registerButton,
      }}
    />
  );
}
