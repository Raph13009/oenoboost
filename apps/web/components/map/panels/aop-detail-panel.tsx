"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  VignobleMapLocale,
  VignobleMapStrings,
} from "@/components/map/types";
import { buildAopDetailHref } from "@/features/vignoble/lib/aop-slug";
import type { AopMapGrape } from "@/features/vignoble/actions/get-aop-map-info";

export type AopPanelInfo = {
  id: number;
  slug: string | null;
  name: string;
  area_hectares: number | null;
  is_grand_cru: boolean;
  region_slug: string | null;
  subregion_slug: string | null;
  grapes: AopMapGrape[];
};

type AopDetailPanelProps = {
  aop: AopPanelInfo;
  loading: boolean;
  locale: VignobleMapLocale;
  strings: VignobleMapStrings;
  onBack: () => void;
};

function GrapeChips({
  title,
  grapes,
}: {
  title: string;
  grapes: AopMapGrape[];
}) {
  if (grapes.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {grapes.map((grape) => (
          <Link
            key={grape.id}
            href={`/cepages/${grape.slug}`}
            className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:border-wine/20 hover:bg-accent hover:text-wine"
          >
            {grape.name_fr}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AopDetailPanel({
  aop,
  loading,
  locale,
  strings,
  onBack,
}: AopDetailPanelProps) {
  const mainGrapes = aop.grapes.filter((g) => g.is_primary);
  const accessoryGrapes = aop.grapes.filter((g) => !g.is_primary);
  const hasGrapeChips = mainGrapes.length > 0 || accessoryGrapes.length > 0;

  // `from=map` marks the link as an AOP-detail link so the route renders the
  // fiche even when the AOP shares its slug with a subregion; `subregion=`
  // additionally gives the detail page its back-to-map context.
  const detailHref =
    aop.region_slug && aop.slug
      ? buildAopDetailHref(aop.region_slug, aop.slug, {
          from: "map",
          subregion: aop.subregion_slug ?? undefined,
        })
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <div className="font-heading text-lg text-wine">{aop.name}</div>
          {aop.is_grand_cru && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              Grand Cru
            </span>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onBack}>
          {strings.backToRegion}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-3">
        <div className="text-xs text-muted-foreground">
          {strings.hectaresLabel}
        </div>
        <div className="text-sm">
          {aop.area_hectares === null
            ? loading
              ? strings.loading
              : strings.na
            : new Intl.NumberFormat(locale).format(aop.area_hectares)}
        </div>

        {loading && !hasGrapeChips ? (
          <>
            <div className="mt-3 text-xs text-muted-foreground">
              {strings.grapesLabel}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {strings.loading}
            </div>
          </>
        ) : hasGrapeChips ? (
          <>
            <GrapeChips
              title={strings.mainGrapesLabel ?? strings.grapesLabel}
              grapes={mainGrapes}
            />
            <GrapeChips
              title={strings.accessoryGrapesLabel ?? strings.grapesLabel}
              grapes={accessoryGrapes}
            />
          </>
        ) : (
          <>
            <div className="mt-3 text-xs text-muted-foreground">
              {strings.grapesLabel}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{strings.na}</div>
          </>
        )}

        {detailHref ? (
          <div className="mt-4">
            <Link
              href={detailHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-wine px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {strings.openAopDetail}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
