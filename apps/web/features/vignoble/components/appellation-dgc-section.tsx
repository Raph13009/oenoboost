"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { DgcChildSummary } from "../queries/aop-dgc.queries";
import { RichText } from "./rich-text";

type Labels = {
  sectionTitle: string;
  areaLabel: string;
  emptyExplanation: string;
};

type Props = {
  items: DgcChildSummary[];
  locale: Locale;
  /** Child slug highlighted when user arrived from that DGC (map click). */
  highlightedSlug?: string | null;
  labels: Labels;
};

export function AppellationDgcSection({
  items,
  locale,
  highlightedSlug,
  labels,
}: Props) {
  const initialSlug =
    highlightedSlug && items.some((c) => c.slug === highlightedSlug)
      ? highlightedSlug
      : (items[0]?.slug ?? null);
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightedSlug) return;
    if (!items.some((c) => c.slug === highlightedSlug)) return;
    setActiveSlug(highlightedSlug);
  }, [items, highlightedSlug]);

  useEffect(() => {
    if (!highlightedSlug || !tabsRef.current) return;
    const btn = tabsRef.current.querySelector<HTMLElement>(
      `[data-dgc-slug="${CSS.escape(highlightedSlug)}"]`,
    );
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [highlightedSlug]);

  if (items.length === 0) return null;

  const active = items.find((c) => c.slug === activeSlug) ?? items[0];
  const explanation =
    locale === "en"
      ? (active.explanation_en ?? active.explanation_fr ?? "")
      : (active.explanation_fr ?? active.explanation_en ?? "");

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:col-span-2 md:p-5">
      <h2 className="font-heading text-xl font-semibold">{labels.sectionTitle}</h2>

      <div
        ref={tabsRef}
        className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label={labels.sectionTitle}
      >
        {items.map((child) => {
          const selected = child.slug === active.slug;
          return (
            <button
              key={child.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-dgc-slug={child.slug}
              onClick={() => setActiveSlug(child.slug)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? "border-wine bg-wine text-white"
                  : "border-border bg-background hover:border-wine/20 hover:text-wine"
              }`}
            >
              {child.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background p-3 md:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold text-wine">
            {active.name}
          </h3>
          {active.area_hectares != null && (
            <p className="text-sm text-muted-foreground">
              {labels.areaLabel}:{" "}
              {Number(active.area_hectares).toLocaleString(locale)} ha
            </p>
          )}
        </div>
        {explanation.trim().length > 0 ? (
          <RichText
            value={explanation}
            className="mt-3 max-w-prose leading-relaxed text-foreground/85"
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {labels.emptyExplanation}
          </p>
        )}
      </div>
    </section>
  );
}
