"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getContent } from "@/lib/i18n/get-content";
import { cn } from "@/lib/utils";
import type { WineRegionHistoryMilestone } from "../types";

type Labels = {
  title: string;
  selectHint: string;
};

type Props = {
  milestones: WineRegionHistoryMilestone[];
  locale: Locale;
  labels: Labels;
  /** Compact layout for the map bottom sheet. */
  compact?: boolean;
};

export function RegionHistoryTimeline({
  milestones,
  locale,
  labels,
  compact = false,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    milestones[0]?.id ?? null,
  );
  const activeId = milestones.some((m) => m.id === selectedId)
    ? selectedId
    : (milestones[0]?.id ?? null);
  const selected =
    milestones.find((m) => m.id === activeId) ?? milestones[0] ?? null;

  if (milestones.length === 0) return null;

  const detail = selected ? getContent(selected, "detail", locale).trim() : "";
  const selectedTitle = selected ? getContent(selected, "title", locale) : "";
  const selectedPeriod = selected
    ? getContent(selected, "period_label", locale)
    : "";

  return (
    <section
      className={cn(
        compact
          ? "rounded-xl border border-border bg-card p-2 md:p-3"
          : "rounded-xl border border-border bg-card p-4 md:p-5",
      )}
    >
      {!compact ? (
        <>
          <h2 className="font-heading text-xl font-semibold">{labels.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.selectHint}</p>
        </>
      ) : (
        <h3 className="font-heading text-sm font-semibold text-wine md:text-base">
          {labels.title}
        </h3>
      )}

      <div
        className={cn(
          "overflow-x-auto overscroll-x-contain",
          compact ? "mt-2 pb-1" : "mt-5 -mx-1 pb-3",
        )}
      >
        <div className="relative flex min-w-full items-start gap-0 px-1">
          <div
            className={cn(
              "pointer-events-none absolute left-4 right-4 h-px bg-wine/25",
              compact ? "top-[1.85rem]" : "top-[2.35rem] md:top-[2.5rem]",
            )}
            aria-hidden
          />
          {milestones.map((milestone) => {
            const period = getContent(milestone, "period_label", locale);
            const title = getContent(milestone, "title", locale);
            const active = milestone.id === selected?.id;

            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => setSelectedId(milestone.id)}
                className={cn(
                  "relative z-10 flex shrink-0 flex-col items-center gap-1.5 px-2 text-center transition-colors",
                  compact ? "w-28 md:w-36" : "w-36 md:w-44 gap-2",
                  active ? "text-wine" : "text-foreground hover:text-wine",
                )}
                aria-pressed={active}
              >
                <span className="font-mono text-[10px] font-medium tabular-nums text-muted-foreground md:text-[11px]">
                  {period || "—"}
                </span>
                <span
                  className={cn(
                    "box-border block shrink-0 rounded-full border-2 border-wine/45 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-all duration-300",
                    compact ? "h-3 w-3" : "h-3.5 w-3.5 md:h-4 md:w-4",
                    active
                      ? "border-wine bg-wine/25 shadow-[0_2px_8px_rgba(124,39,54,0.35)] ring-[3px] ring-wine/35"
                      : "ring-0 ring-transparent",
                  )}
                  aria-hidden
                />
                {!compact && milestone.icon_url ? (
                  <span className="relative mt-1 h-8 w-8 overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                    <Image
                      src={milestone.icon_url}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-0.5"
                    />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "font-heading font-semibold leading-snug",
                    compact ? "text-xs md:text-sm" : "text-sm md:text-[15px]",
                  )}
                >
                  {title || "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className={cn(
            "rounded-lg border border-border/70 bg-background",
            compact ? "mt-1.5 p-2 md:p-3" : "mt-2 p-4",
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
            {selectedPeriod}
          </p>
          <h3
            className={cn(
              "mt-0.5 font-heading font-semibold",
              compact ? "text-sm md:text-base" : "text-lg",
            )}
          >
            {selectedTitle}
          </h3>
          {detail ? (
            <p
              className={cn(
                "mt-1.5 whitespace-pre-wrap leading-relaxed text-foreground/85",
                compact ? "text-xs md:text-sm line-clamp-4" : "mt-3 text-[15px]",
              )}
            >
              {detail}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
