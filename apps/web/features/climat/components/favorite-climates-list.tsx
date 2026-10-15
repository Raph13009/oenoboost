"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getContent } from "@/lib/i18n/get-content";
import { toggleClimateFavoriteAction } from "../actions/climate-favorite-actions";
import type { FavoriteClimateRow } from "../queries/climate-favorites.queries";

type Props = {
  initialItems: FavoriteClimateRow[];
  locale: Locale;
  labels: { removeAria: string };
};

export function FavoriteClimatesList({
  initialItems,
  locale,
  labels,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const name = getContent(item.climate, "name", locale);
        return (
          <li
            key={item.favoriteId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <Link
              href={`/climat/${item.climate.slug}?from=favorites`}
              className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-foreground hover:text-wine"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{
                  backgroundColor: item.climate.color_hex ?? "#888",
                }}
              />
              <span className="truncate">{name}</span>
            </Link>
            <button
              type="button"
              disabled={isPending}
              aria-label={labels.removeAria}
              onClick={() => {
                const next = items.filter(
                  (row) => row.favoriteId !== item.favoriteId,
                );
                setItems(next);
                startTransition(async () => {
                  const result = await toggleClimateFavoriteAction(
                    item.climate.id,
                    item.climate.slug,
                  );
                  if (!result.ok) setItems(items);
                });
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-wine"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
