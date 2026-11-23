import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildAopDetailHref } from "@/features/vignoble/lib/aop-slug";
import { getAopBrowseItems } from "@/features/vignoble/queries/aop-navigation.queries";
import { AopFilters } from "@/features/vignoble/components/aop-filters";
import { AopBrowseCard } from "@/features/vignoble/components/aop-browse-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoritedContentIds } from "@/features/favorites/queries/favorites.queries";

type Props = {
  searchParams?: Promise<{ region?: string; subregion?: string; from?: string }>;
};

export default async function AopListPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  const qp = (await searchParams) ?? {};

  const data = await getAopBrowseItems({
    regionId: qp.region,
    subregionId: qp.subregion,
  });

  const user = await getCurrentUser();
  const favIds = user
    ? await getFavoritedContentIds(user.id)
    : { grapeIds: new Set<string>(), aopIds: new Set<string>() };

  const aopFavoriteLabels = {
    favoriteAria: dict.vignoble.favoriteAddAria,
    unfavoriteAria: dict.vignoble.favoriteRemoveAria,
    addedToast: dict.vignoble.favoriteAddedToast,
    removedToast: dict.vignoble.favoriteRemovedToast,
    authModal: {
      title: dict.vignoble.favoriteAuthTitle,
      body: dict.vignoble.favoriteAuthBody,
      login: dict.vignoble.favoriteAuthLogin,
      register: dict.vignoble.favoriteAuthRegister,
    },
    premiumLimit: {
      title: dict.favorites.premiumLimitTitle,
      body: dict.favorites.premiumLimitBody,
      acknowledge: dict.favorites.premiumLimitAck,
    },
  };

  const backHref = qp.from === "home" ? "/" : "/vignoble";
  const backLabel = qp.from === "home" ? dict.common.back : dict.vignoble.backToRegions;

  return (
    <div className="vs-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] pb-16 lg:-mx-8">
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-12 pt-8 sm:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--vs-muted)] transition-colors hover:text-[var(--vs-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <section className="mt-8 grid gap-8 border-b border-[var(--vs-line)] pb-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="vs-eyebrow text-[var(--vs-ink)]">
              {dict.vignoble.aopHeroEyebrow}
            </p>
            <h1 className="mt-5 font-heading text-[clamp(2.6rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[var(--vs-ink)]">
              {dict.vignoble.aopHeroTitleBefore}
              <br />
              <em className="italic">{dict.vignoble.aopHeroTitleEmphasis}</em>
            </h1>
            <p className="mt-6 max-w-xl font-heading text-[17px] leading-[1.7] text-[var(--vs-sage)]">
              {dict.vignoble.aopHeroLead}
            </p>
          </div>
          <div className="rounded-[14px] bg-[var(--vs-ink)] px-6 py-8 text-center text-[var(--vs-paper)]">
            <p className="font-heading text-[clamp(3rem,8vw,4.5rem)] italic leading-none">
              {data.items.length || "—"}
            </p>
            <p className="mt-3 text-[12px] tracking-[0.35em]">AOP</p>
            <p className="mx-auto mt-4 max-w-[14rem] font-heading text-sm italic text-[var(--vs-paper)]/90">
              {dict.vignoble.aopExploreCta}
            </p>
          </div>
        </section>

        <section className="mt-10" id="liste-aop">
          <p className="vs-eyebrow mb-3">{dict.vignoble.aopFilterHint}</p>
          <AopFilters
            locale={locale}
            regionLabel={dict.vignoble.regions}
            selectedRegionId={qp.region ?? ""}
            regions={data.regions}
          />

          {data.items.length === 0 ? (
            <p className="py-12 text-center text-[var(--vs-muted)]">
              {dict.common.empty}
            </p>
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              {data.items.map((item) => {
                const hasRegion = Boolean(item.region_slug);
                const href = hasRegion
                  ? buildAopDetailHref(item.region_slug, item.slug, {
                      from: "list",
                      subregion: item.subregion_slug,
                      listRegion: qp.region,
                      listSubregion: qp.subregion,
                    })
                  : "";
                return (
                  <AopBrowseCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    href={href}
                    initialFavorited={favIds.aopIds.has(String(item.id))}
                    isLoggedIn={!!user}
                    favoriteLabels={aopFavoriteLabels}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
