"use client";

import type { AopListItem } from "../layers/use-aop-layer";

type AopListPanelProps = {
  items: AopListItem[];
  onPick: (id: number, name: string) => void;
  /** When set, list is filtered to this subregion (issue #12). */
  filterLabel?: string | null;
  onClearFilter?: () => void;
  clearFilterLabel?: string;
  emptyLabel?: string;
};

export function AopListPanel({
  items,
  onPick,
  filterLabel,
  onClearFilter,
  clearFilterLabel = "Tout afficher",
  emptyLabel = "Aucune AOP",
}: AopListPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card md:h-auto md:max-h-[min(60vh,520px)] md:w-56 md:border-border/60 md:bg-card/95 md:shadow-sm md:backdrop-blur-[2px]">
      {filterLabel ? (
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-2.5 py-2">
          <p className="min-w-0 truncate text-[11px] font-medium leading-snug text-muted-foreground">
            {filterLabel}
          </p>
          {onClearFilter ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="shrink-0 text-[11px] font-medium text-wine hover:underline"
            >
              {clearFilterLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-y-auto p-1.5">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item.id, item.name)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.colorHex }}
              />
              <span className="truncate text-[13px] font-medium leading-snug">
                {item.name}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
