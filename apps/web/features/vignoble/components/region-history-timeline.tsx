"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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
};

export function RegionHistoryTimeline({ milestones, locale, labels }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    milestones[0]?.id ?? null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Derive the active milestone without syncing via effect (avoids setState-in-effect).
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
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-heading text-xl font-semibold">{labels.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{labels.selectHint}</p>

      <div
        ref={scrollerRef}
        className="mt-5 -mx-1 overflow-x-auto overscroll-x-contain pb-3"
      >
        <div className="relative flex min-w-full items-start gap-0 px-1">
          <div
            className="pointer-events-none absolute left-4 right-4 top-[2.35rem] h-px bg-wine/25 md:top-[2.5rem]"
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
                  "relative z-10 flex w-36 shrink-0 flex-col items-center gap-2 px-2 text-center transition-colors md:w-44",
                  active ? "text-wine" : "text-foreground hover:text-wine",
                )}
                aria-pressed={active}
              >
                <span className="font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
                  {period || "—"}
                </span>
                <span
                  className={cn(
                    "box-border block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-wine/45 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-all duration-300 md:h-4 md:w-4",
                    active
                      ? "border-wine bg-wine/25 shadow-[0_2px_8px_rgba(124,39,54,0.35)] ring-[3px] ring-wine/35"
                      : "ring-0 ring-transparent",
                  )}
                  aria-hidden
                />
                {milestone.icon_url ? (
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
                <span className="font-heading text-sm font-semibold leading-snug md:text-[15px]">
                  {title || "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-2 rounded-lg border border-border/70 bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {selectedPeriod}
          </p>
          <h3 className="mt-1 font-heading text-lg font-semibold">{selectedTitle}</h3>
          {detail ? (
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">
              {detail}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
