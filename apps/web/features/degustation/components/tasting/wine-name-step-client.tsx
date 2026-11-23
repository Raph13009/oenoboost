"use client";

import Link from "next/link";
import { useState } from "react";

import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  isColorCompatibleWithWineType,
  type WineTypeId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
};

const WINE_TYPES: { id: WineTypeId; labelKey: "wineTypeWhite" | "wineTypeRed" | "wineTypeRose" }[] =
  [
    { id: "white", labelKey: "wineTypeWhite" },
    { id: "red", labelKey: "wineTypeRed" },
    { id: "rose", labelKey: "wineTypeRose" },
  ];

export function WineNameStepClient({ labels }: Props) {
  const { draft, patch } = useTastingFlow();
  const [error, setError] = useState<"name" | "type" | null>(null);

  const canContinue =
    draft.wine_name.trim().length > 0 && draft.wine_type != null;

  const selectWineType = (next: WineTypeId) => {
    const colorClash =
      (draft.eye_color &&
        !isColorCompatibleWithWineType(draft.eye_color, next)) ||
      (draft.eye_reflets &&
        !isColorCompatibleWithWineType(draft.eye_reflets, next));

    if (colorClash) {
      const ok = window.confirm(labels.wineTypeChangeWarn);
      if (!ok) return;
      patch({
        wine_type: next,
        eye_color: null,
        eye_reflets: null,
      });
    } else {
      patch({ wine_type: next });
    }
    setError(null);
  };

  return (
    <div className="vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] bg-[#f8f5ef] pb-24 text-[#3b2c2b] lg:-mx-8">
      <div className="mx-auto flex w-full max-w-[720px] flex-col px-6 pb-10 pt-10 sm:px-8">
        <p className="text-[10px] font-medium tracking-[1.5px] text-[#7d7169]">
          {labels.epureStepperLabel}
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-cormorant)] text-[clamp(2.2rem,5vw,3.2rem)] font-normal leading-[1.05] text-[#3b2c2b]">
          {labels.wineStepTitleBefore}
          <br />
          <span className="italic">{labels.wineStepTitleAfter}</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#80716b]">
          {labels.wineStepLead}
        </p>

        <div className="mt-10 rounded-[10px] bg-[#eee8de] px-6 py-6">
          <label className="block">
            <span className="text-[10px] font-medium tracking-[1.5px] text-[#837361]">
              {labels.epureGlassLabel}
            </span>
            <input
              value={draft.wine_name}
              onChange={(e) => {
                patch({ wine_name: e.target.value });
                if (e.target.value.trim()) setError(null);
              }}
              placeholder={labels.eyeWinePlaceholder}
              autoFocus
              className={cn(
                "mt-3 w-full border-0 bg-transparent font-[family-name:var(--font-cormorant)] text-[32px] leading-none text-[#3b2c2b] outline-none placeholder:text-[#b0a398]",
                error === "name" && "placeholder:text-[#a04a4a]",
              )}
            />
          </label>
          <div className="my-5 h-px bg-[#e0d5c8]" />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#837361]">
                {labels.wineVintageShort}
              </span>
              <input
                value={draft.vintage}
                onChange={(e) => patch({ vintage: e.target.value })}
                placeholder={labels.eyeVintagePlaceholder}
                inputMode="numeric"
                className="mt-2 w-full border-0 bg-transparent text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#837361]">
                {labels.wineOriginLabel}
              </span>
              <input
                value={draft.wine_origin}
                onChange={(e) => patch({ wine_origin: e.target.value })}
                placeholder={labels.wineOriginPlaceholder}
                className="mt-2 w-full border-0 bg-transparent text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398]"
              />
            </label>
          </div>

          <div className="my-5 h-px bg-[#e0d5c8]" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#837361]">
            {labels.wineTypeLabel}
          </p>
          <p className="mt-1 text-[12px] text-[#776a60]">{labels.wineTypeLead}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {WINE_TYPES.map(({ id, labelKey }) => {
              const active = draft.wine_type === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectWineType(id)}
                  className={cn(
                    "inline-flex h-11 items-center justify-center rounded-[6px] border text-[13px] transition-colors",
                    active
                      ? "border-[#752e42] bg-[#752e42] font-semibold text-white"
                      : "border-[#ddd6cc] bg-white text-[#65594f]",
                    error === "type" && !draft.wine_type && "border-[#a04a4a]",
                  )}
                >
                  {labels[labelKey]}
                </button>
              );
            })}
          </div>
        </div>

        {error === "name" ? (
          <p className="mt-3 text-[13px] text-[#752e42]">
            {labels.wineStepRequired}
          </p>
        ) : error === "type" ? (
          <p className="mt-3 text-[13px] text-[#752e42]">
            {labels.wineTypeRequired}
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-[#776a60]">{labels.wineStepHint}</p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {canContinue ? (
            <Link
              href="/degustation/oeil/start"
              className="inline-flex h-11 items-center justify-between gap-8 rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white"
            >
              <span>{labels.wineStepContinue}</span>
              <span aria-hidden className="text-[20px]">
                →
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!draft.wine_name.trim()) setError("name");
                else if (!draft.wine_type) setError("type");
              }}
              className="inline-flex h-11 items-center justify-between gap-8 rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white"
            >
              <span>{labels.wineStepContinue}</span>
              <span aria-hidden className="text-[20px]">
                →
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
