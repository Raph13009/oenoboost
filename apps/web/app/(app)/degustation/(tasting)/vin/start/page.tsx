import { WineNameStepClient } from "@/features/degustation/components/tasting/wine-name-step-client";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  return {
    title: `${dict.tastingFlow.wineStepMeta} — OenoBoost`,
  };
}

export default async function TastingWineStartPage() {
  const dict = await getDictionary(await getServerLocale());
  return <WineNameStepClient labels={dict.tastingFlow} />;
}
