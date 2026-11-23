"use client";

import Link from "next/link";
import { useState } from "react";

import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
};

export function WineNameStepClient({ labels }: Props) {
  const { draft, patch } = useTastingFlow();
  const [error, setError] = useState(false);

  const canContinue = draft.wine_name.trim().length > 0;

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
                if (e.target.value.trim()) setError(false);
              }}
              placeholder={labels.eyeWinePlaceholder}
              autoFocus
              className={cn(
                "mt-3 w-full border-0 bg-transparent font-[family-name:var(--font-cormorant)] text-[32px] leading-none text-[#3b2c2b] outline-none placeholder:text-[#b0a398]",
                error && "placeholder:text-[#a04a4a]",
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
        </div>

        {error ? (
          <p className="mt-3 text-[13px] text-[#752e42]">
            {labels.wineStepRequired}
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
              onClick={() => setError(true)}
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
