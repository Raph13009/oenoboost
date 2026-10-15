import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";
import { ClimateDetail } from "@/features/climat/components/climate-detail";
import { isClimateFavorited } from "@/features/climat/queries/climate-favorites.queries";
import {
  getClimateBySlug,
  getRelatedGrapesForClimate,
  getRelatedRegionsForClimate,
} from "@/features/climat/queries/climat.queries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export default async function ClimateDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const qp = (await searchParams) ?? {};
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);

  const climate = await getClimateBySlug(slug);
  if (!climate) notFound();

  const [relatedRegions, relatedGrapes, user] = await Promise.all([
    getRelatedRegionsForClimate(climate.id),
    getRelatedGrapesForClimate(climate.id),
    getCurrentUser(),
  ]);

  const initialFavorited = user
    ? await isClimateFavorited(user.id, climate.id)
    : false;

  const isFromFavorites = qp.from === "favorites";
  const backHref = isFromFavorites ? "/profil/favoris" : "/climat";
  const backLabel = isFromFavorites
    ? dict.favorites.backToFavorites
    : dict.climat.backToClimates;

  return (
    <div className="flex flex-col gap-6">
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-wine"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        {isFromFavorites ? (
          <Link
            href="/climat"
            className="inline-flex items-center justify-center rounded-full bg-wine px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-wine/90"
          >
            {dict.climat.viewAllClimates}
          </Link>
        ) : null}
      </div>

      <ClimateDetail
        locale={locale}
        climate={climate}
        relatedRegions={relatedRegions}
        relatedGrapes={relatedGrapes}
        emptyRegionsLabel={dict.climat.noRelatedRegions}
        emptyGrapesLabel={dict.climat.noRelatedGrapes}
        userPlan={user?.plan === "premium" ? "premium" : "free"}
        favorite={{
          climateId: climate.id,
          climateSlug: climate.slug,
          initialFavorited,
          isLoggedIn: !!user,
        }}
        favoriteLabels={{
          favoriteAria: dict.climat.favoriteAddAria,
          unfavoriteAria: dict.climat.favoriteRemoveAria,
          addedToast: dict.climat.favoriteAddedToast,
          removedToast: dict.climat.favoriteRemovedToast,
          authModal: {
            title: dict.climat.favoriteAuthTitle,
            body: dict.climat.favoriteAuthBody,
            login: dict.climat.favoriteAuthLogin,
            register: dict.climat.favoriteAuthRegister,
          },
          premiumLimit: {
            title: dict.favorites.premiumLimitTitle,
            body: dict.favorites.premiumLimitBody,
            acknowledge: dict.favorites.premiumLimitAck,
          },
        }}
        labels={{
          definition: dict.climat.definition,
          characteristics: dict.climat.characteristics,
          temperatureAmplitude: dict.climat.temperatureAmplitude,
          rainfall: dict.climat.rainfall,
          sunshine: dict.climat.sunshine,
          frostHailRisk: dict.climat.frostHailRisk,
          vineWineImpact: dict.climat.vineWineImpact,
          relatedRegions: dict.climat.relatedRegions,
          relatedGrapes: dict.climat.relatedGrapes,
          primaryBadge: dict.climat.primaryBadge,
          premiumBadge: dict.climat.premiumBadge,
        }}
      />
    </div>
  );
}
