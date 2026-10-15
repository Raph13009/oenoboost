import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";
import { ClimateMap } from "@/features/climat/components/climate-map";
import { ClimatesList } from "@/features/climat/components/climates-list";
import {
  getClimateMapGeojson,
  getPublishedClimates,
} from "@/features/climat/queries/climat.queries";

export const metadata = {
  title: "Climat — OenoBoost",
};

export default async function ClimatPage() {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  const [climates, geojson] = await Promise.all([
    getPublishedClimates(),
    getClimateMapGeojson(),
  ]);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <header className="flex shrink-0 flex-col gap-2 md:gap-3">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">
          {dict.climat.title}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-600 md:text-base">
          {dict.climat.intro}
        </p>
      </header>

      {climates.length === 0 ? (
        <p className="flex min-h-[16rem] items-center justify-center text-center text-muted-foreground">
          {dict.common.empty}
        </p>
      ) : (
        <>
          <ClimateMap
            geojson={geojson}
            climates={climates}
            locale={locale}
            legendTitle={dict.climat.legendTitle}
            secondaryLabel={dict.climat.secondaryClimates}
            mapHint={dict.climat.mapHint}
          />

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-semibold md:text-2xl">
              {dict.climat.cardsTitle}
            </h2>
            <div className="-mx-6 w-[calc(100%+3rem)] md:mx-0 md:w-full">
              <ClimatesList climates={climates} locale={locale} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
