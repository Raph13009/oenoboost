"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

export type EpureStep = 1 | 2 | 3;

type Props = {
  labels: Dictionary["tastingFlow"];
  step: EpureStep;
  wineName: string;
  metaLine: string;
  wineTypeLabel: string;
  tipTitle1: string;
  tipTitle2: string;
  tip1: string;
  tip2: string;
  notebookTitle: string;
  impression: string;
  notebookHint: string;
  children: ReactNode;
};

export function EpureTastingShell({
  labels,
  step,
  wineName,
  metaLine,
  wineTypeLabel,
  tipTitle1,
  tipTitle2,
  tip1,
  tip2,
  notebookTitle,
  impression,
  notebookHint,
  children,
}: Props) {
  const steps = [
    {
      n: "01" as const,
      title: labels.epureStepVisual,
      sub: labels.epureStepVisualSub,
      active: step === 1,
      done: step > 1,
    },
    {
      n: "02" as const,
      title: labels.epureStepNose,
      sub: labels.epureStepNoseSub,
      active: step === 2,
      done: step > 2,
    },
    {
      n: "03" as const,
      title: labels.epureStepMouth,
      sub: labels.epureStepMouthSub,
      active: step === 3,
      done: false,
    },
  ];

  const stepOf =
    step === 1
      ? labels.epureStepOf
      : step === 2
        ? labels.epureStepOf2
        : labels.epureStepOf3;

  return (
    <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] bg-[#f8f5ef] text-[#3b2c2b] lg:-mx-8">
      <section className="bg-[#352629]">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[1fr_620px]">
          <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-24 lg:py-[38px]">
            <p className="text-[11px] font-medium uppercase tracking-[2.1px] text-[#d5ba95]">
              {labels.epureHeroEyebrow}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-[clamp(2.4rem,4.5vw,3.625rem)] font-normal leading-none text-[#fcf7f0]">
              {labels.epureHeroTitle1}
            </h1>
            <p className="mt-1 font-[family-name:var(--font-cormorant)] text-[clamp(2.4rem,4.5vw,3.625rem)] font-normal italic leading-none text-[#fcf7f0]">
              {labels.epureHeroTitle2}
            </p>
            <p className="mt-8 max-w-[620px] whitespace-pre-line text-[15px] leading-normal text-[#ddcfca]">
              {labels.epureHeroLead}
            </p>
            <p className="mt-8 text-[11px] text-[#c6b4ad]">{labels.epureHeroMeta}</p>
          </div>
          <div className="relative hidden h-[330px] lg:block">
            <Image
              src="/tasting/epure/hero-wine.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="620px"
            />
          </div>
          <div className="relative h-[200px] lg:hidden">
            <Image
              src="/tasting/epure/hero-wine.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 py-7 sm:px-8 lg:px-24">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#7d7169]">
            {labels.epureStepperLabel}
          </p>
          <p className="text-[11px] text-[#7d7169]">{stepOf}</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className={cn(
                "flex h-[78px] items-center gap-4 rounded-[8px] px-[18px]",
                s.active ? "bg-[#f0e4e3]" : "bg-[#f8f5ef]",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full text-[12px] font-medium",
                  s.active
                    ? "bg-[#752e42] text-white"
                    : s.done
                      ? "bg-[#752e42]/15 text-[#752e42]"
                      : "bg-[#eae4db] text-[#80746e]",
                )}
              >
                {s.done ? "✓" : s.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[17px] font-semibold",
                      s.active ? "text-[#752e42]" : "text-[#746b65]",
                    )}
                  >
                    {s.title}
                  </p>
                  {s.active ? (
                    <span className="shrink-0 pt-1 text-[8px] font-semibold uppercase tracking-wide text-[#752e42]">
                      {labels.epureInProgress}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[12px] text-[#80716b]">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-6 pb-10 sm:px-8 lg:grid-cols-[minmax(0,824px)_minmax(0,400px)] lg:justify-between lg:px-24 lg:gap-6">
        {children}

        <div className="flex flex-col gap-[20px]">
          <div className="rounded-[10px] bg-[#eee8de] p-6">
            <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#837361]">
              {labels.epureGlassLabel}
            </p>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-[32px] leading-none text-[#3b2c2b]">
              {wineName}
            </p>
            {metaLine ? (
              <p className="mt-3 text-[12px] text-[#776a60]">{metaLine}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex h-[25px] items-center rounded-[4px] bg-[#e4d6d3] px-3 text-[10px] font-medium text-[#752e42]">
                {wineTypeLabel}
              </span>
              <Link
                href="/degustation/vin/start"
                className="text-[11px] text-[#752e42]"
              >
                {labels.wineStepEdit}
              </Link>
            </div>
          </div>

          <div className="rounded-[10px] bg-[#f1ebdd] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#897354]">
              {labels.epureTipLabel}
            </p>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-[31px] italic leading-none text-[#534332]">
              {tipTitle1}
              <br />
              {tipTitle2}
            </p>
            <div className="mt-8 space-y-5">
              <div className="flex gap-3">
                <span className="text-[12px] font-semibold text-[#9d8059]">
                  01
                </span>
                <p className="whitespace-pre-line text-[12px] leading-normal text-[#726451]">
                  {tip1}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[12px] font-semibold text-[#9d8059]">
                  02
                </span>
                <p className="whitespace-pre-line text-[12px] leading-normal text-[#726451]">
                  {tip2}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#e7e0d7] bg-white p-6">
            <p className="text-[10px] font-medium uppercase tracking-[1.2px] text-[#83766c]">
              {labels.epureNotebookLabel}
            </p>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-[27px] leading-none text-[#3b2c2b]">
              {notebookTitle}
            </p>
            <p className="mt-4 whitespace-pre-line font-[family-name:var(--font-cormorant)] text-[14px] italic leading-normal text-[#6b5955]">
              {impression}
            </p>
            <div className="my-5 h-px bg-[#ece6df]" />
            <p className="text-[11px] text-[#8a7b70]">{notebookHint}</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 border-t border-[#ded7ce] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-24">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="font-[family-name:var(--font-cormorant)] text-[27px] text-[#622a39]">
            OenoBoost
          </p>
          <p className="text-[12px] text-[#82766f]">{labels.epureFooterTag}</p>
        </div>
        <p className="text-[10px] text-[#82766f]">{labels.epureFooterLegal}</p>
      </footer>
    </div>
  );
}
