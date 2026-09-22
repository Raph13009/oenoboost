"use client";

import { forwardRef, useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRegionHistoryMilestonesAction } from "@/features/vignoble/actions/get-region-history-milestones";
import { RegionHistoryTimeline } from "@/features/vignoble/components/region-history-timeline";
import type { WineRegionHistoryMilestone } from "@/features/vignoble/types";
import type {
  VignobleMapLocale,
  VignobleMapRegion,
  VignobleMapStrings,
} from "@/components/map/types";

type PanelMode = "info" | "history";

type RegionDetailCardProps = {
  region: VignobleMapRegion | null;
  locale: VignobleMapLocale;
  strings: VignobleMapStrings;
  discoverDisabled: boolean;
  onClose: () => void;
  onDiscover: () => void;
};

export const RegionDetailCard = forwardRef<HTMLDivElement, RegionDetailCardProps>(
  function RegionDetailCard(
    { region, locale, strings, discoverDisabled, onClose, onDiscover },
    ref,
  ) {
    const [milestones, setMilestones] = useState<WineRegionHistoryMilestone[]>(
      [],
    );
    const [historyLoading, setHistoryLoading] = useState(false);
    const [mode, setMode] = useState<PanelMode>("info");

    useEffect(() => {
      setMode("info");
      if (!region?.region_id) {
        setMilestones([]);
        return;
      }

      let cancelled = false;
      setHistoryLoading(true);
      setMilestones([]);

      getRegionHistoryMilestonesAction(region.region_id)
        .then((rows) => {
          if (!cancelled) setMilestones(rows);
        })
        .catch(() => {
          if (!cancelled) setMilestones([]);
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [region?.region_id]);

    const hasHistory = milestones.length > 0;

    return (
      <div
        ref={ref}
        className="absolute bottom-0 left-0 right-0 z-20 max-h-[55%] overflow-y-auto overscroll-contain rounded-t-lg border-t border-border bg-background md:max-h-[50%]"
      >
        <div className="flex items-start justify-between gap-3 p-2 pb-1.5 md:p-4 md:pb-3">
          <div className="min-w-0">
            <div className="font-heading text-lg text-wine md:text-xl">
              {region?.name ?? ""}
            </div>
            {!region && (
              <div className="mt-2 text-sm text-muted-foreground">
                {strings.na}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {region && hasHistory ? (
              <div
                className="inline-flex rounded-full border border-border bg-card p-0.5"
                role="group"
                aria-label={strings.footerPanelToggleAria}
              >
                <button
                  type="button"
                  onClick={() => setMode("info")}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === "info"
                      ? "bg-wine text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={mode === "info"}
                >
                  {strings.footerInfoTab}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("history")}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === "history"
                      ? "bg-wine text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={mode === "history"}
                >
                  {strings.footerHistoryTab}
                </button>
              </div>
            ) : null}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={strings.closeLabel}
              className="shrink-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {region && mode === "info" && (
          <div className="px-2 pb-2 pt-0 md:px-4 md:pb-4">
            <div className="mt-0 grid grid-cols-2 gap-1.5 md:gap-3">
              <div className="rounded-xl border border-border bg-card p-2 md:p-3">
                <div className="text-xs text-muted-foreground">
                  {strings.departmentsLabel}
                </div>
                <div className="mt-1 font-heading text-base md:text-lg">
                  {region.department_count === null
                    ? strings.na
                    : new Intl.NumberFormat(locale).format(
                        region.department_count,
                      )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-2 md:p-3">
                <div className="text-xs text-muted-foreground">
                  {strings.hectaresLabel}
                </div>
                <div className="mt-1 font-heading text-base md:text-lg">
                  {region.area_hectares === null
                    ? strings.na
                    : new Intl.NumberFormat(locale).format(
                        region.area_hectares,
                      )}
                </div>
              </div>

              <div className="col-span-2 rounded-xl border border-border bg-card p-2 md:p-3">
                <div className="text-xs text-muted-foreground">
                  {strings.totalProductionLabel}
                </div>
                <div className="mt-1 font-heading text-base md:text-lg">
                  {region.total_production_hl === null
                    ? strings.na
                    : `${new Intl.NumberFormat(locale).format(
                        region.total_production_hl,
                      )} hl`}
                </div>
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <Button
                className="h-11 w-full"
                disabled={discoverDisabled}
                onClick={onDiscover}
              >
                {strings.discover}
              </Button>
            </div>
          </div>
        )}

        {region && mode === "history" && (
          <div className="px-2 pb-2 pt-0 md:px-4 md:pb-4">
            {historyLoading ? (
              <p className="text-xs text-muted-foreground">{strings.loading}</p>
            ) : (
              <RegionHistoryTimeline
                milestones={milestones}
                locale={locale}
                compact
                labels={{
                  title: strings.historyTimelineTitle,
                  selectHint: strings.historyTimelineHint,
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  },
);
