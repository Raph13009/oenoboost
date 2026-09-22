import Link from "next/link";
import { Star } from "lucide-react";
import type { Appellation } from "../types";
import type { Locale } from "@/lib/i18n/config";
import { getContent } from "@/lib/i18n/get-content";
import type { RelatedSoil } from "@/features/sols/types";
import type { RelatedGrape } from "@/features/cepages/types";
import type { DgcChildSummary } from "../queries/aop-dgc.queries";
import { PremiumGate } from "@/components/shared/premium-gate";

import { getWineColorBreakdown } from "../lib/wine-color-breakdown";
import type { AopWineColorPieChartLabels } from "./aop-wine-color-pie-chart";
import { AopWineColorPieChart } from "./aop-wine-color-pie-chart";
import type { AppellationFavoriteLabels } from "./appellation-favorite-button";
import { AppellationFavoriteButton } from "./appellation-favorite-button";
import { AppellationDgcSection } from "./appellation-dgc-section";
import { RichText } from "./rich-text";

type AppellationDetailProps = {
  appellation: Appellation;
  locale: Locale;
  favorite?: {
    appellationId: string;
    regionSlug: string;
    subregionSlug: string;
    aopSlug: string;
    initialFavorited: boolean;
    isLoggedIn: boolean;
  };
  favoriteLabels?: AppellationFavoriteLabels;
  userPlan: "free" | "premium";
  relatedSoils?: RelatedSoil[];
  relatedGrapes?: RelatedGrape[];
  dgcChildren?: DgcChildSummary[];
  highlightedDgcSlug?: string | null;
  soilLabels?: {
    relatedSoils: string;
    emptyRelatedSoils: string;
  };
  grapeLabels?: {
    mainGrapes: string;
    accessoryGrapes: string;
    relatedSoilsPreview: string;
    freePreviewTitle: string;
  };
  dgcLabels?: {
    sectionTitle: string;
    areaLabel: string;
    emptyExplanation: string;
  };
  wineColorLabels?: AopWineColorPieChartLabels;
  climateTitle?: string;
};

function ChipLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-wine/20 hover:bg-accent hover:text-wine"
    >
      {label}
    </Link>
  );
}

function ChipRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

export function AppellationDetail({
  appellation,
  locale,
  favorite,
  favoriteLabels,
  userPlan,
  relatedSoils = [],
  relatedGrapes = [],
  dgcChildren = [],
  highlightedDgcSlug = null,
  soilLabels,
  grapeLabels,
  dgcLabels,
  wineColorLabels,
  climateTitle,
}: AppellationDetailProps) {
  const name = appellation.name;
  const wineColorBreakdown = getWineColorBreakdown(appellation);
  const history = getContent(appellation, "history", locale);
  const soils = getContent(appellation, "soils_description", locale);
  const climate = getContent(appellation, "climate", locale).trim();
  const showClimate = climate.length > 0;
  const locked = appellation.is_premium && userPlan !== "premium";

  const mainGrapes = relatedGrapes.filter((g) => g.is_primary);
  const accessoryGrapes = relatedGrapes.filter((g) => !g.is_primary);

  const na = "...";
  const formatNumber = (value: number | null | undefined) =>
    value == null || Number.isNaN(Number(value))
      ? na
      : Number(value).toLocaleString(locale);
  const formatYear = (value: number | null | undefined) =>
    value == null || Number.isNaN(Number(value)) ? na : String(value);
  const formatPriceRange = () => {
    if (
      appellation.price_range_min_eur === null ||
      appellation.price_range_max_eur === null
    ) {
      return na;
    }
    return `${Number(appellation.price_range_min_eur)}€ - ${Number(
      appellation.price_range_max_eur,
    )}€`;
  };

  const hasArea = appellation.area_hectares != null;
  const hasProduction = appellation.production_volume_hl != null;
  const hasYear = appellation.recognition_year != null;
  const hasPreviewStats = hasArea || hasProduction || hasYear;
  const showPreviewPie = Boolean(wineColorBreakdown && wineColorLabels);
  const showPreviewSoils = relatedSoils.length > 0;
  const showPreviewMainGrapes = mainGrapes.length > 0;
  const showPreviewAccessoryGrapes = accessoryGrapes.length > 0;
  const showPreviewGrapes = showPreviewMainGrapes || showPreviewAccessoryGrapes;
  const showFreePreview =
    locked &&
    (showPreviewPie || hasPreviewStats || showPreviewSoils || showPreviewGrapes);

  const header = (
    <div className="rounded-2xl border border-border bg-card px-4 py-5 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold text-wine md:text-4xl">
            {locale === "fr" ? "AOP" : "AOP"} {name}
          </h1>
          {appellation.is_grand_cru && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Grand Cru
            </span>
          )}
        </div>
        {favorite && favoriteLabels && (
          <AppellationFavoriteButton
            appellationId={favorite.appellationId}
            regionSlug={favorite.regionSlug}
            aopSlug={favorite.aopSlug}
            subregionSlug={favorite.subregionSlug}
            initialFavorited={favorite.initialFavorited}
            isLoggedIn={favorite.isLoggedIn}
            labels={favoriteLabels}
          />
        )}
      </div>
    </div>
  );

  const freePreview = showFreePreview ? (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-heading text-xl font-semibold">
        {grapeLabels?.freePreviewTitle ??
          (locale === "fr" ? "Aperçu" : "Preview")}
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        {showPreviewPie && wineColorBreakdown && wineColorLabels && (
          <AopWineColorPieChart
            breakdown={wineColorBreakdown}
            labels={wineColorLabels}
          />
        )}

        {hasPreviewStats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {hasArea && (
              <div className="rounded-lg border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {locale === "fr" ? "Surface" : "Area"}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatNumber(appellation.area_hectares)} ha
                </p>
              </div>
            )}
            {hasProduction && (
              <div className="rounded-lg border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {locale === "fr" ? "Production" : "Production"}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatNumber(appellation.production_volume_hl)} hl
                </p>
              </div>
            )}
            {hasYear && (
              <div className="rounded-lg border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {locale === "fr" ? "Date AOP" : "AOP date"}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatYear(appellation.recognition_year)}
                </p>
              </div>
            )}
          </div>
        )}

        {showPreviewSoils && (
          <ChipRow
            title={
              grapeLabels?.relatedSoilsPreview ??
              (locale === "fr" ? "Sols" : "Soils")
            }
          >
            {relatedSoils.map((soil) => (
              <ChipLink
                key={soil.id}
                href={`/sols/${soil.slug}`}
                label={soil.name_fr}
              />
            ))}
          </ChipRow>
        )}

        {showPreviewMainGrapes && (
          <ChipRow
            title={
              grapeLabels?.mainGrapes ??
              (locale === "fr" ? "Cépages principaux" : "Main grape varieties")
            }
          >
            {mainGrapes.map((grape) => (
              <ChipLink
                key={grape.id}
                href={`/cepages/${grape.slug}`}
                label={grape.name_fr}
              />
            ))}
          </ChipRow>
        )}

        {showPreviewAccessoryGrapes && (
          <ChipRow
            title={
              grapeLabels?.accessoryGrapes ??
              (locale === "fr"
                ? "Cépages accessoires"
                : "Accessory grape varieties")
            }
          >
            {accessoryGrapes.map((grape) => (
              <ChipLink
                key={grape.id}
                href={`/cepages/${grape.slug}`}
                label={grape.name_fr}
              />
            ))}
          </ChipRow>
        )}
      </div>
    </section>
  ) : null;

  const fullBody = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      {wineColorBreakdown && wineColorLabels && (
        <div className="md:col-span-2">
          <AopWineColorPieChart
            breakdown={wineColorBreakdown}
            labels={wineColorLabels}
          />
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {locale === "fr" ? "Chiffres clés" : "Key figures"}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Surface" : "Area"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatNumber(appellation.area_hectares)}{" "}
              {appellation.area_hectares === null ? "" : "ha"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Producteurs" : "Producers"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatNumber(appellation.producer_count)}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Production" : "Production"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatNumber(appellation.production_volume_hl)}{" "}
              {appellation.production_volume_hl === null ? "" : "hl"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Prix" : "Price range"}
            </p>
            <p className="mt-1 text-sm font-medium">{formatPriceRange()}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Date AOP" : "AOP date"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatYear(appellation.recognition_year)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {locale === "fr" ? "Cépages" : "Grape varieties"}
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {mainGrapes.length > 0 && (
            <ChipRow
              title={
                grapeLabels?.mainGrapes ??
                (locale === "fr"
                  ? "Cépages principaux"
                  : "Main grape varieties")
              }
            >
              {mainGrapes.map((grape) => (
                <ChipLink
                  key={grape.id}
                  href={`/cepages/${grape.slug}`}
                  label={grape.name_fr}
                />
              ))}
            </ChipRow>
          )}
          {accessoryGrapes.length > 0 && (
            <ChipRow
              title={
                grapeLabels?.accessoryGrapes ??
                (locale === "fr"
                  ? "Cépages accessoires"
                  : "Accessory grape varieties")
              }
            >
              {accessoryGrapes.map((grape) => (
                <ChipLink
                  key={grape.id}
                  href={`/cepages/${grape.slug}`}
                  label={grape.name_fr}
                />
              ))}
            </ChipRow>
          )}
          {mainGrapes.length === 0 && accessoryGrapes.length === 0 && (
            <p className="text-sm text-muted-foreground">{na}</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {locale === "fr" ? "Histoire" : "History"}
        </h2>
        <RichText
          value={history || na}
          className="mt-3 max-w-prose leading-relaxed text-foreground/85"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {locale === "fr" ? "Sols" : "Soils"}
        </h2>
        <RichText
          value={soils || na}
          className="mt-3 leading-relaxed text-foreground/85"
        />
        {soilLabels && (
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {soilLabels.relatedSoils}
            </p>
            {relatedSoils.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {soilLabels.emptyRelatedSoils}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {relatedSoils.map((soil) => (
                  <ChipLink
                    key={soil.id}
                    href={`/sols/${soil.slug}`}
                    label={soil.name_fr}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {showClimate && (
        <section className="rounded-xl border border-border bg-card p-4 md:p-5 md:col-span-2">
          <h2 className="font-heading text-xl font-semibold">
            {climateTitle ?? (locale === "fr" ? "Climat" : "Climate")}
          </h2>
          <RichText
            value={climate}
            className="mt-3 max-w-prose leading-relaxed text-foreground/85"
          />
        </section>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {header}
      {freePreview}
      {locked ? (
        <PremiumGate isPremium={appellation.is_premium} userPlan={userPlan}>
          {fullBody}
        </PremiumGate>
      ) : (
        fullBody
      )}
      {dgcLabels && dgcChildren.length > 0 && (
        <AppellationDgcSection
          items={dgcChildren}
          locale={locale}
          highlightedSlug={highlightedDgcSlug}
          labels={dgcLabels}
        />
      )}
    </div>
  );
}
