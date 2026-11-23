"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { AopBrowseItem } from "@/features/vignoble/queries/aop-navigation.queries";
import type { AppellationFavoriteLabels } from "./appellation-favorite-button";
import { AppellationFavoriteButton } from "./appellation-favorite-button";

type Props = {
  item: AopBrowseItem;
  locale: Locale;
  href: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  favoriteLabels: AppellationFavoriteLabels;
};

export function AopBrowseCard({
  item,
  locale,
  href,
  initialFavorited,
  isLoggedIn,
  favoriteLabels,
}: Props) {
  const name = item.name;
  const regionName = locale === "fr" ? item.region_name_fr : item.region_name_en;
  const subName =
    locale === "fr" ? item.subregion_name_fr : item.subregion_name_en;
  const hasContext = Boolean(regionName || subName);
  const subline = [regionName, subName].filter(Boolean).join(" • ");
  const isLinkable = href && !href.startsWith("/vignoble//");

  return (
    <div className="group flex items-stretch overflow-hidden border border-[var(--vs-line)] bg-[var(--vs-paper)] transition-colors hover:border-[var(--vs-ink)]/25">
      {isLinkable ? (
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4 sm:px-5"
        >
          <div className="min-w-0">
            <div className="font-heading text-base font-medium text-[var(--vs-ink)] sm:text-lg">
              {name}
            </div>
            {hasContext ? (
              <div className="mt-1 text-xs tracking-wide text-[var(--vs-sage)]">
                {subline}
              </div>
            ) : null}
          </div>
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--vs-sage)] text-[var(--vs-ink)] transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="font-heading text-base font-medium">{name}</div>
            {hasContext ? (
              <div className="mt-1 text-xs text-[var(--vs-sage)]">{subline}</div>
            ) : null}
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center border-l border-[var(--vs-line)] px-2">
        <AppellationFavoriteButton
          appellationId={String(item.id)}
          regionSlug={item.region_slug}
          aopSlug={item.slug}
          subregionSlug={item.subregion_slug}
          initialFavorited={initialFavorited}
          isLoggedIn={isLoggedIn}
          labels={favoriteLabels}
          size="sm"
        />
      </div>
    </div>
  );
}
