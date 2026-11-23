import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";
import { getContent } from "@/lib/i18n/get-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";

import { GrapeFavoriteButton } from "@/features/cepages/components/grape-favorite-button";
import type { GrapeFavoriteLabels } from "@/features/cepages/components/grape-favorite-button";
import { AppellationFavoriteButton } from "@/features/vignoble/components/appellation-favorite-button";
import type { AppellationFavoriteLabels } from "@/features/vignoble/components/appellation-favorite-button";
import { buildAopDetailHref } from "@/features/vignoble/lib/aop-slug";
import { SoilFavoriteButton } from "@/features/sols/components/soil-favorite-button";
import type { SoilFavoriteLabels } from "@/features/sols/components/soil-favorite-button";
import { DailyQuestionBubble } from "@/features/quiz/components/daily-question-bubble";
import { DailyQuestionCta } from "@/features/quiz/components/daily-question-cta";
import {
  HomeKnowledgeExplorer,
  type HomeKnowledgeItem,
} from "@/features/home/components/home-knowledge-explorer";
import { getRegionNavMeta } from "@/features/vignoble/queries/get-regions";

import { getFavoriteGrapesForUser } from "@/features/cepages/queries/favorites.queries";
import type { FavoriteGrapeRow } from "@/features/cepages/queries/favorites.queries";
import { getFavoriteAppellationsForUser } from "@/features/vignoble/queries/aop-favorites.queries";
import type { FavoriteAppellationRow } from "@/features/vignoble/queries/aop-favorites.queries";
import { getFavoriteSoilsForUser } from "@/features/sols/queries/soil-favorites.queries";
import type { FavoriteSoilRow } from "@/features/sols/queries/soil-favorites.queries";

import "@/features/home/home-make.css";

type FavoriteHomeItem =
  | { type: "grape"; row: FavoriteGrapeRow }
  | { type: "aop"; row: FavoriteAppellationRow }
  | { type: "soil"; row: FavoriteSoilRow };

export default async function HomePage() {
  const [locale, user] = await Promise.all([
    getServerLocale(),
    getCurrentUser(),
  ]);
  const dict = await getDictionary(locale);

  const [grapeRows, aopRows, soilRows, regions] = await Promise.all([
    user ? getFavoriteGrapesForUser(user.id) : Promise.resolve([]),
    user ? getFavoriteAppellationsForUser(user.id) : Promise.resolve([]),
    user ? getFavoriteSoilsForUser(user.id) : Promise.resolve([]),
    getRegionNavMeta(),
  ]);

  const publishedRegions = regions.filter((region) => region.status === "published");

  const resolveRegionHref = (needles: string[], fallback: string) => {
    const match = publishedRegions.find((region) => {
      const nameFr = getContent(region, "name", "fr").toLowerCase();
      const nameEn = getContent(region, "name", "en").toLowerCase();
      const slug = region.slug.toLowerCase();
      return needles.some(
        (needle) =>
          nameFr.includes(needle) ||
          nameEn.includes(needle) ||
          slug.includes(needle.replace(/\s+/g, "-")),
      );
    });
    return match ? `/vignoble/${match.slug}` : fallback;
  };

  const showcaseRegions = [
    {
      key: "bourgogne",
      name: "Bourgogne",
      place: dict.home.regionBourgognePlace,
      aop: dict.home.regionBourgogneAop,
      grape: dict.home.regionBourgogneGrape,
      image: "/images/regions/bourgogne.jpg",
      href: resolveRegionHref(["bourgogne", "burgundy"], "/vignoble/regions"),
    },
    {
      key: "bordeaux",
      name: "Bordeaux",
      place: dict.home.regionBordeauxPlace,
      aop: dict.home.regionBordeauxAop,
      grape: dict.home.regionBordeauxGrape,
      image: "/images/regions/bordeaux.jpg",
      href: resolveRegionHref(["bordeaux"], "/vignoble/regions"),
    },
    {
      key: "rhone",
      name: dict.home.regionRhoneName,
      place: dict.home.regionRhonePlace,
      aop: dict.home.regionRhoneAop,
      grape: dict.home.regionRhoneGrape,
      image: "/images/regions/rhone.jpg",
      href: resolveRegionHref(
        ["rhône", "rhone", "vallée du rhône", "vallee du rhone"],
        "/vignoble/regions",
      ),
    },
  ];

  const favoritesCount = grapeRows.length + aopRows.length + soilRows.length;

  const favoriteItems: FavoriteHomeItem[] = favoritesCount
    ? [
        ...grapeRows.map((row) => ({ type: "grape" as const, row })),
        ...aopRows.map((row) => ({ type: "aop" as const, row })),
        ...soilRows.map((row) => ({ type: "soil" as const, row })),
      ].slice(0, 5)
    : [];

  const grapeFavoriteLabels: GrapeFavoriteLabels = {
    favoriteAria: dict.cepages.favoriteAddAria,
    unfavoriteAria: dict.cepages.favoriteRemoveAria,
    addedToast: dict.cepages.favoriteAddedToast,
    removedToast: dict.cepages.favoriteRemovedToast,
    authModal: {
      title: dict.cepages.favoriteAuthTitle,
      body: dict.cepages.favoriteAuthBody,
      login: dict.cepages.favoriteAuthLogin,
      register: dict.cepages.favoriteAuthRegister,
    },
    premiumLimit: {
      title: dict.favorites.premiumLimitTitle,
      body: dict.favorites.premiumLimitBody,
      acknowledge: dict.favorites.premiumLimitAck,
    },
  };

  const aopFavoriteLabels: AppellationFavoriteLabels = {
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

  const soilFavoriteLabels: SoilFavoriteLabels = {
    favoriteAria: dict.sols.favoriteAddAria,
    unfavoriteAria: dict.sols.favoriteRemoveAria,
    addedToast: dict.sols.favoriteAddedToast,
    removedToast: dict.sols.favoriteRemovedToast,
    authModal: {
      title: dict.sols.favoriteAuthTitle,
      body: dict.sols.favoriteAuthBody,
      login: dict.sols.favoriteAuthLogin,
      register: dict.sols.favoriteAuthRegister,
    },
    premiumLimit: {
      title: dict.favorites.premiumLimitTitle,
      body: dict.favorites.premiumLimitBody,
      acknowledge: dict.favorites.premiumLimitAck,
    },
  };

  const dailyQuestionAuthCopy = {
    title: dict.cepages.favoriteAuthTitle,
    body:
      locale === "en"
        ? "This feature requires an account. Create one to start a quiz."
        : "Cette fonctionnalité nécessite de créer un compte pour lancer un quiz.",
    login: dict.cepages.favoriteAuthLogin,
    register: dict.cepages.favoriteAuthRegister,
  };

  const knowledgeItems: HomeKnowledgeItem[] = [
    {
      id: "aop",
      href: "/vignoble/aop?from=home",
      title: dict.home.moduleAopTitle,
      subtitle: dict.home.moduleAopSubtitle,
      filter: "aop",
      accent: "wine",
      icon: "⌁",
      meta: dict.home.moduleAopMeta,
    },
    {
      id: "cepages",
      href: "/cepages",
      title: dict.home.moduleCepagesTitle,
      subtitle: dict.home.moduleCepagesSubtitle,
      filter: "cepages",
      accent: "sage",
      icon: "♧",
      meta: dict.home.moduleCepagesMeta,
    },
    {
      id: "sols",
      href: "/sols",
      title: dict.home.moduleSolsTitle,
      subtitle: dict.home.moduleSolsSubtitle,
      filter: "sols",
      accent: "wine",
      icon: "≋",
      meta: dict.home.moduleSolsMeta,
    },
    {
      id: "climat",
      href: "/climat",
      title: dict.home.moduleClimatTitle,
      subtitle: dict.home.moduleClimatSubtitle,
      filter: "climats",
      accent: "sage",
      icon: "☼",
      meta: dict.home.moduleClimatMeta,
    },
    {
      id: "dictionnaire",
      href: "/dictionnaire",
      title: dict.home.moduleDictionnaireTitle,
      subtitle: dict.home.moduleDictionnaireSubtitle,
      filter: "vocabulaire",
      accent: "wine",
      icon: "Aa",
      meta: dict.home.moduleDictionnaireMeta,
    },
  ];

  const quizLevels = [
    {
      href: "/quiz?type=beginner",
      level: locale === "en" ? "Beginner" : "Débutant",
      eyebrow: dict.home.quizBeginnerEyebrow,
      title: dict.home.quizBeginnerTitle,
      text: dict.home.quizBeginnerText,
      meta: dict.home.quizBeginnerMeta,
      dot: "#8a9a7b",
    },
    {
      href: "/quiz?type=intermediate",
      level: locale === "en" ? "Intermediate" : "Intermédiaire",
      eyebrow: dict.home.quizIntermediateEyebrow,
      title: dict.home.quizIntermediateTitle,
      text: dict.home.quizIntermediateText,
      meta: dict.home.quizIntermediateMeta,
      dot: "#fffdec",
    },
    {
      href: "/quiz?type=expert",
      level: locale === "en" ? "Expert" : "Expert",
      eyebrow: dict.home.quizExpertEyebrow,
      title: dict.home.quizExpertTitle,
      text: dict.home.quizExpertText,
      meta: dict.home.quizExpertMeta,
      dot: "#7c2536",
    },
  ];

  return (
    <div className="home-make home-make-bleed -mt-5 pb-10">
      <section className="home-make-hero" id="accueil" aria-labelledby="home-hero-title">
        <div className="home-make-hero-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home-hero.jpg"
            alt=""
            width={1800}
            height={1200}
          />
        </div>
        <div className="home-make-hero-shade" aria-hidden="true" />
        <div className="home-make-hero-content">
          <p className="eyebrow eyebrow-light">{dict.home.heroEyebrow}</p>
          <h1 id="home-hero-title">
            {dict.home.heroTitleBefore}
            <br />
            {locale === "en" ? "through its " : "à travers ses "}
            <em>{dict.home.heroTitleEmphasis}</em>
          </h1>
          <p className="max-w-[520px] font-heading text-[17px] leading-[1.7] text-[rgba(255,253,236,0.8)]">
            {dict.home.heroCopy}
          </p>
          <a href="#explorer" className="home-make-primary">
            {dict.home.cta} <span aria-hidden>→</span>
          </a>
        </div>
        <a href="#explorer" className="home-make-scroll-cue">
          <span>{dict.home.heroScroll}</span>
          <span aria-hidden className="rotate-90 text-xl">
            →
          </span>
        </a>
        <p className="home-make-hero-credit">{dict.home.heroPhotoCredit}</p>
        <span className="sr-only">{dict.home.heroImageAlt}</span>
      </section>

      <section
        className="mx-auto grid max-w-[1440px] gap-10 px-[6vw] py-[5.5rem] md:grid-cols-2 md:gap-[10vw]"
        aria-labelledby="home-intro-title"
      >
        <div>
          <p className="eyebrow">{dict.home.introEyebrow}</p>
          <h2
            id="home-intro-title"
            className="mt-5 font-heading text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-none tracking-[-0.04em]"
          >
            {dict.home.introTitleBefore}
            <br />
            {locale === "en" ? "with the " : "par la "}
            <em className="italic">{dict.home.introTitleEmphasis}</em>
          </h2>
        </div>
        <div className="max-w-[500px] md:pt-8">
          <p className="font-heading text-[1.25rem] font-medium leading-[1.5]">
            {dict.home.introLead}
          </p>
          <p className="mt-6 text-sm leading-[1.8] text-[var(--home-sage)]">
            {dict.home.introBody}
          </p>
        </div>
      </section>

      <section className="home-make-knowledge" id="explorer" aria-label={dict.home.searchAria}>
        <HomeKnowledgeExplorer
          items={knowledgeItems}
          labels={{
            searchPlaceholder: dict.home.searchPlaceholder,
            searchAria: dict.home.searchAria,
            searchClearAria: dict.home.searchClearAria,
            searchEmpty: dict.home.searchEmpty,
            filters: [
              { id: "all", label: dict.home.filterAll },
              { id: "aop", label: dict.home.filterAop },
              { id: "cepages", label: dict.home.filterCepages },
              { id: "sols", label: dict.home.filterSols },
              { id: "climats", label: dict.home.filterClimats },
              { id: "vocabulaire", label: dict.home.filterVocabulaire },
            ],
          }}
        />
      </section>

      <section className="home-make-regions" id="regions" aria-labelledby="home-regions-title">
        <div className="home-make-regions-heading">
          <div>
            <p className="eyebrow">{dict.home.regionsEyebrow}</p>
            <h2 id="home-regions-title">
              {dict.home.regionsTitleBefore}{" "}
              <em className="italic">{dict.home.regionsTitleEmphasis}</em>
            </h2>
          </div>
          <Link href="/vignoble/regions" prefetch className="home-make-regions-see-all">
            {dict.home.regionsSeeAll} <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="home-make-region-grid">
          {showcaseRegions.map((region, index) => (
            <Link
              key={region.key}
              href={region.href}
              prefetch
              className="home-make-region-card"
              aria-label={region.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={region.image}
                alt={`Paysage viticole de ${region.name}`}
                width={900}
                height={1200}
              />
              <div className="region-overlay" aria-hidden />
              <span className="region-index">0{index + 1}</span>
              <div className="region-info">
                <p>{region.place}</p>
                <h3>{region.name}</h3>
                <div className="region-meta">
                  <span>{region.aop}</span>
                  <span>{region.grape}</span>
                </div>
              </div>
              <span className="region-arrow" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-make-quiz" id="quiz" aria-labelledby="home-quiz-title">
        <div className="mx-auto mb-14 grid max-w-[1400px] gap-8 md:grid-cols-[1.3fr_0.7fr] md:items-end md:gap-[10vw]">
          <div>
            <p className="eyebrow eyebrow-light">{dict.home.quizEyebrow}</p>
            <h2
              id="home-quiz-title"
              className="mt-4 font-heading text-[clamp(2.4rem,4.5vw,4.2rem)] font-medium leading-none tracking-[-0.04em]"
            >
              {dict.home.quizTitleBefore}{" "}
              <em className="italic">{dict.home.quizTitleEmphasis}</em>
              <br />
              {dict.home.quizTitleAfter}
            </h2>
          </div>
          <p className="max-w-[480px] font-heading text-base leading-[1.8] text-[var(--home-paper)]">
            {dict.home.quizIntro}
          </p>
        </div>

        <div className="home-make-quiz-levels">
          {quizLevels.map((quiz, index) => (
            <article key={quiz.href} className="home-make-quiz-level">
              <div className="flex items-center justify-between text-[10px] tracking-[0.2em]">
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_5px_rgba(255,253,236,0.05)]"
                  style={{ background: quiz.dot }}
                  aria-hidden
                />
                <span>0{index + 1}</span>
              </div>
              <p className="mt-14 text-[9px] uppercase tracking-[0.2em] text-[var(--home-paper)]">
                {quiz.eyebrow}
              </p>
              <h3>{quiz.level}</h3>
              <h4>{quiz.title}</h4>
              <p className="max-w-[320px] text-xs leading-[1.8] text-[var(--home-paper)]">
                {quiz.text}
              </p>
              <footer className="mt-auto flex items-center justify-between border-t border-[rgba(255,253,236,0.11)] pt-6">
                <span className="text-[9px] uppercase tracking-[0.12em]">{quiz.meta}</span>
                <DailyQuestionCta
                  href={quiz.href}
                  isLoggedIn={!!user}
                  label={`${dict.home.quizStart} ${quiz.level}`}
                  authCopy={dailyQuestionAuthCopy}
                  className="inline-flex items-center gap-3 text-[11px] text-[var(--home-paper)]"
                >
                  {dict.home.quizStart} <span aria-hidden>→</span>
                </DailyQuestionCta>
              </footer>
            </article>
          ))}
        </div>

        <div className="home-make-quiz-stats">
          <div>
            <strong>45</strong>
            <span>{dict.home.quizStatQuestions}</span>
          </div>
          <div>
            <strong>3</strong>
            <span>{dict.home.quizStatLevels}</span>
          </div>
          <div>
            <strong>∞</strong>
            <span>{dict.home.quizStatLearn}</span>
          </div>
        </div>
      </section>

      {favoritesCount > 0 ? (
        <section
          className="bg-[var(--home-paper)] px-[5vw] py-16"
          aria-labelledby="home-favorites-title"
        >
          <div className="mx-auto max-w-[1400px]">
            <h2
              id="home-favorites-title"
              className="font-heading text-[clamp(2rem,3.5vw,3rem)] font-medium tracking-[-0.04em]"
            >
              {dict.nav.myFavorites}
            </h2>
            <div className="mt-8 flex w-full min-w-0 gap-3 overflow-x-auto pb-1 no-scrollbar">
              {favoriteItems.map((item) => {
                if (item.type === "grape") {
                  const name = getContent(item.row.grape, "name", locale);
                  const typeLabel =
                    item.row.grape.type === "red"
                      ? dict.cepages.red
                      : item.row.grape.type === "white"
                        ? dict.cepages.white
                        : dict.cepages.rose;

                  return (
                    <div
                      key={`grape:${item.row.grape.id}`}
                      className="w-[8.75rem] shrink-0 border border-[var(--home-line)] bg-[var(--home-paper)] px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/cepages/${item.row.grape.slug}?from=favorites`}
                            prefetch
                            className="block min-w-0"
                            aria-label={name}
                          >
                            <div className="truncate font-heading text-[0.92rem] font-semibold leading-tight">
                              {name}
                            </div>
                          </Link>
                          <div className="mt-2 text-xs font-medium text-[var(--home-sage)]">
                            {typeLabel}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <GrapeFavoriteButton
                            grapeId={item.row.grape.id}
                            grapeSlug={item.row.grape.slug}
                            initialFavorited={true}
                            isLoggedIn={!!user}
                            labels={grapeFavoriteLabels}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === "aop") {
                  const href = buildAopDetailHref(
                    item.row.regionSlug,
                    item.row.appellation.slug,
                    {
                      subregion: item.row.subregionSlug,
                      from: "favorites",
                    },
                  );
                  const name = item.row.appellation.name;

                  return (
                    <div
                      key={`aop:${item.row.appellation.id}`}
                      className="w-[8.75rem] shrink-0 border border-[var(--home-line)] bg-[var(--home-paper)] px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={href}
                            prefetch
                            className="block min-w-0"
                            aria-label={name}
                          >
                            <div className="truncate font-heading text-[0.92rem] font-semibold leading-tight">
                              {name}
                            </div>
                          </Link>
                          <div className="mt-2 text-xs font-medium text-[var(--home-sage)]">
                            AOP
                          </div>
                        </div>
                        <div className="shrink-0">
                          <AppellationFavoriteButton
                            appellationId={String(item.row.appellation.id)}
                            regionSlug={item.row.regionSlug}
                            aopSlug={item.row.appellation.slug}
                            subregionSlug={item.row.subregionSlug}
                            initialFavorited={true}
                            isLoggedIn={!!user}
                            labels={aopFavoriteLabels}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                const href = `/sols/${item.row.soil.slug}?from=favorites`;
                return (
                  <div
                    key={`soil:${item.row.soil.id}`}
                    className="w-[8.75rem] shrink-0 border border-[var(--home-line)] bg-[var(--home-paper)] px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={href}
                          prefetch
                          className="block min-w-0"
                          aria-label={item.row.soil.name_fr}
                        >
                          <div className="truncate font-heading text-[0.92rem] font-semibold leading-tight">
                            {item.row.soil.name_fr}
                          </div>
                        </Link>
                        <div className="mt-2 text-xs font-medium text-[var(--home-sage)]">
                          Sol
                        </div>
                      </div>
                      <div className="shrink-0">
                        <SoilFavoriteButton
                          soilId={item.row.soil.id}
                          soilSlug={item.row.soil.slug}
                          initialFavorited={true}
                          isLoggedIn={!!user}
                          labels={soilFavoriteLabels}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-make-quote" aria-label={dict.home.quoteAuthor}>
        <p>
          {dict.home.quoteTextLine1}
          <br />
          {dict.home.quoteTextLine2}
        </p>
        <span>{dict.home.quoteAuthor}</span>
      </section>

      <footer className="home-make-footer">
        <div className="home-make-footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="OenoBoost"
            width={48}
            height={48}
            className="home-make-footer-logo"
          />
          <span>
            <strong>{dict.home.footerBrand}</strong>
            <small>{dict.home.footerBrandSub}</small>
          </span>
        </div>
        <p className="home-make-footer-tagline">{dict.home.footerTagline}</p>
        <nav className="home-make-footer-links" aria-label="Footer">
          <Link href="/vignoble/aop?from=home">{dict.home.footerLinkAop}</Link>
          <Link href="/cepages">{dict.home.footerLinkCepages}</Link>
          <Link href="/sols">{dict.home.footerLinkSols}</Link>
          <Link href="/quiz">{dict.home.footerLinkQuiz}</Link>
          <Link href="/dictionnaire">{dict.home.footerLinkGlossaire}</Link>
        </nav>
        <nav
          className="home-make-footer-links home-make-footer-legal-links"
          aria-label={dict.home.footerLegalNav}
        >
          <Link href="/mentions-legales">{dict.home.footerLinkMentions}</Link>
          <Link href="/cgv">{dict.home.footerLinkCgv}</Link>
          <Link href="/confidentialite">{dict.home.footerLinkPrivacy}</Link>
        </nav>
        <small className="home-make-footer-legal">{dict.home.footerLegal}</small>
      </footer>

      <div className="home-make-daily">
        <DailyQuestionBubble
          href="/quiz/daily"
          isLoggedIn={!!user}
          title={dict.home.dailyQuestionTitle}
          authCopy={dailyQuestionAuthCopy}
          variant="fab"
          subscribersLabel={dict.home.quizDailySubscribers}
        />
      </div>
    </div>
  );
}
