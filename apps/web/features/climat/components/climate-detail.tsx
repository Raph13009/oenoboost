import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getContent } from "@/lib/i18n/get-content";
import { PremiumGate } from "@/components/shared/premium-gate";
import type {
  ClimateType,
  RelatedClimateGrape,
  RelatedClimateRegion,
} from "../types";
import type { ClimateFavoriteLabels } from "./climate-favorite-button";
import { ClimateFavoriteButton } from "./climate-favorite-button";

type ClimateDetailProps = {
  locale: Locale;
  climate: ClimateType;
  relatedRegions: RelatedClimateRegion[];
  relatedGrapes: RelatedClimateGrape[];
  emptyRegionsLabel: string;
  emptyGrapesLabel: string;
  favorite: {
    climateId: string;
    climateSlug: string;
    initialFavorited: boolean;
    isLoggedIn: boolean;
  };
  favoriteLabels: ClimateFavoriteLabels;
  userPlan: "free" | "premium";
  labels: {
    definition: string;
    characteristics: string;
    temperatureAmplitude: string;
    rainfall: string;
    sunshine: string;
    frostHailRisk: string;
    vineWineImpact: string;
    relatedRegions: string;
    relatedGrapes: string;
    primaryBadge: string;
    premiumBadge: string;
  };
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-3 whitespace-pre-line leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}

export function ClimateDetail({
  locale,
  climate,
  relatedRegions,
  relatedGrapes,
  emptyRegionsLabel,
  emptyGrapesLabel,
  favorite,
  favoriteLabels,
  userPlan,
  labels,
}: ClimateDetailProps) {
  const name = getContent(climate, "name", locale);
  const definition = getContent(climate, "definition", locale);
  const characteristics = getContent(climate, "characteristics", locale);
  const temperatureAmplitude = getContent(
    climate,
    "temperature_amplitude",
    locale,
  );
  const rainfall = getContent(climate, "rainfall", locale);
  const sunshine = getContent(climate, "sunshine", locale);
  const frostHailRisk = getContent(climate, "frost_hail_risk", locale);
  const vineWineImpact = getContent(climate, "vine_wine_impact", locale);

  const body = (
    <div className="flex flex-col gap-4 md:gap-5">
      {definition ? (
        <DetailSection title={labels.definition}>{definition}</DetailSection>
      ) : null}
      {characteristics ? (
        <DetailSection title={labels.characteristics}>
          {characteristics}
        </DetailSection>
      ) : null}
      {temperatureAmplitude ? (
        <DetailSection title={labels.temperatureAmplitude}>
          {temperatureAmplitude}
        </DetailSection>
      ) : null}
      {rainfall ? (
        <DetailSection title={labels.rainfall}>{rainfall}</DetailSection>
      ) : null}
      {sunshine ? (
        <DetailSection title={labels.sunshine}>{sunshine}</DetailSection>
      ) : null}
      {frostHailRisk ? (
        <DetailSection title={labels.frostHailRisk}>
          {frostHailRisk}
        </DetailSection>
      ) : null}
      {vineWineImpact ? (
        <DetailSection title={labels.vineWineImpact}>
          {vineWineImpact}
        </DetailSection>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {labels.relatedRegions}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedRegions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyRegionsLabel}</p>
          ) : (
            relatedRegions.map((region) => {
              const regionName =
                locale === "en" ? region.name_en : region.name_fr;
              return (
                <Link
                  key={region.id}
                  href={`/vignoble?region=${encodeURIComponent(region.slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-wine/30 hover:text-wine"
                >
                  {regionName}
                  {region.is_primary ? (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {labels.primaryBadge}
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="font-heading text-xl font-semibold">
          {labels.relatedGrapes}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedGrapes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyGrapesLabel}</p>
          ) : (
            relatedGrapes.map((grape) => {
              const grapeName =
                locale === "en" ? grape.name_en : grape.name_fr;
              return (
                <Link
                  key={grape.id}
                  href={`/cepages/${grape.slug}`}
                  className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-wine/30 hover:text-wine"
                >
                  {grapeName}
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className="h-24 w-full md:h-32"
          style={{
            background: `linear-gradient(135deg, ${climate.color_hex ?? "#888"}dd, ${climate.color_hex ?? "#888"}66)`,
          }}
        />
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-5 md:px-6 md:py-6">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold text-wine md:text-4xl">
              {name}
            </h1>
            {climate.is_premium ? (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {labels.premiumBadge}
              </span>
            ) : null}
          </div>
          <ClimateFavoriteButton
            climateId={favorite.climateId}
            climateSlug={favorite.climateSlug}
            initialFavorited={favorite.initialFavorited}
            isLoggedIn={favorite.isLoggedIn}
            labels={favoriteLabels}
          />
        </div>
      </div>

      <PremiumGate isPremium={climate.is_premium} userPlan={userPlan}>
        {body}
      </PremiumGate>
    </div>
  );
}
