import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRegionBySlug } from "@/features/vignoble/queries/regions.queries";
import { getSubregions } from "@/features/vignoble/queries/subregions.queries";
import { getRegionHistoryMilestones } from "@/features/vignoble/queries/region-history.queries";
import { SubregionCard } from "@/features/vignoble/components/subregion-card";
import { RegionHistoryTimeline } from "@/features/vignoble/components/region-history-timeline";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContent } from "@/lib/i18n/get-content";

type Props = {
  params: Promise<{ region: string }>;
};

export default async function RegionPage({ params }: Props) {
  const { region: regionSlug } = await params;
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);

  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const [subregions, milestones] = await Promise.all([
    getSubregions(region.id),
    getRegionHistoryMilestones(region.id),
  ]);
  const regionName = getContent(region, "name", locale);
  const mainGrapes = getContent(region, "main_grapes", locale).trim();

  const formatNumber = (value: number | null) =>
    value === null ? dict.common.na : new Intl.NumberFormat(locale).format(value);

  return (
    <div className="flex flex-col gap-6">
      <div className="mt-4">
        <Link
          href="/vignoble/regions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-wine"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.vignoble.backToRegionsList}
        </Link>

        <h1 className="mt-3 font-heading text-3xl font-semibold md:text-4xl">
          {regionName}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            href={`/vignoble?region=${encodeURIComponent(region.slug)}`}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground transition-colors hover:border-wine/30 hover:text-wine"
          >
            {dict.vignoble.openOnMap}
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border/70 bg-card p-3">
          <p className="text-xs text-muted-foreground">{dict.vignoble.departmentCount}</p>
          <p className="mt-1 text-sm font-medium">{formatNumber(region.department_count)}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-card p-3">
          <p className="text-xs text-muted-foreground">{dict.vignoble.hectares}</p>
          <p className="mt-1 text-sm font-medium">{formatNumber(region.area_hectares)}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-card p-3">
          <p className="text-xs text-muted-foreground">{dict.vignoble.totalProduction}</p>
          <p className="mt-1 text-sm font-medium">
            {region.total_production_hl === null
              ? dict.common.na
              : `${formatNumber(region.total_production_hl)} hl`}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-card p-3">
          <p className="text-xs text-muted-foreground">{dict.vignoble.mapGrapesLabel}</p>
          <p className="mt-1 text-sm font-medium">{mainGrapes || dict.common.na}</p>
        </div>
      </section>

      {milestones.length > 0 ? (
        <RegionHistoryTimeline
          milestones={milestones}
          locale={locale}
          labels={{
            title: dict.vignoble.historyTimelineTitle,
            selectHint: dict.vignoble.historyTimelineHint,
          }}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold">{dict.vignoble.subregions}</h2>
        {subregions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{dict.common.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {subregions.map((sub) => (
              <SubregionCard
                key={sub.id}
                subregion={sub}
                regionSlug={regionSlug}
                locale={locale}
                hectaresLabel={dict.vignoble.hectares}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
