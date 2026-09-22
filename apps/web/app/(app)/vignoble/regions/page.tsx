import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRegions } from "@/features/vignoble/queries/regions.queries";
import { RegionCard } from "@/features/vignoble/components/region-card";

export const metadata = {
  title: "Régions viticoles — OenoBoost",
};

export default async function RegionsListPage() {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  const regions = (await getRegions()).filter((region) => region.status === "published");

  return (
    <div className="flex flex-col gap-6">
      <div className="mt-4">
        <Link
          href="/vignoble"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-wine"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.vignoble.backToMap}
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-semibold md:text-4xl">
          {dict.vignoble.regionsListTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {dict.vignoble.regionsListIntro}
        </p>
      </div>

      {regions.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{dict.common.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {regions.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              locale={locale}
              hectaresLabel={dict.vignoble.hectares}
            />
          ))}
        </div>
      )}
    </div>
  );
}
