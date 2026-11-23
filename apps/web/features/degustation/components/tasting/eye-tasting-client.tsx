"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  parseIntensity,
  parseLimpidity,
  type EyeIntensity,
  type EyeLimpidity,
} from "@/features/degustation/tasting/eye-observations";
import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  EPURE_EYE_COLORS,
  colorLabelKey,
  type WineColorId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
};

function OptionBtn({
  active,
  label,
  onClick,
  className,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[42px] items-center rounded-[6px] border px-[18px] text-left text-[12px] transition-colors",
        active
          ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
          : "border-[#ddd6cc] bg-white font-normal text-[#6c615c]",
        className,
      )}
    >
      {active ? `${label}  ✓` : label}
    </button>
  );
}

export function EyeTastingClient({ labels }: Props) {
  const router = useRouter();
  const { draft, hydrated, patch } = useTastingFlow();
  const [draftFlash, setDraftFlash] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.wine_name.trim()) {
      router.replace("/degustation/vin/start");
    }
  }, [hydrated, draft.wine_name, router]);

  const limpidity = parseLimpidity(draft.eye_robe);
  const intensity = parseIntensity(draft.eye_intensity);

  const colorLabel = (id: WineColorId) => {
    const k = colorLabelKey(id) as keyof Dictionary["tastingFlow"];
    return String(labels[k] ?? id);
  };

  const selectedColorLabel = draft.eye_color
    ? colorLabel(draft.eye_color as WineColorId)
    : null;

  const intensityLabel =
    intensity === "light"
      ? labels.intensityPale
      : intensity === "medium"
        ? labels.intensityMedium
        : intensity === "intense"
          ? labels.intensityIntense
          : null;

  const limpidityLabel =
    limpidity === "limpid"
      ? labels.limpidClear
      : limpidity === "slightly_cloudy"
        ? labels.limpidSlight
        : limpidity === "cloudy"
          ? labels.limpidCloudy
          : null;

  const impression = useMemo(() => {
    if (!selectedColorLabel && !intensityLabel && !limpidityLabel) {
      return labels.epureImpressionEmpty;
    }
    const colorBit = selectedColorLabel
      ? labels.epureImpressionColor.replace("{color}", selectedColorLabel.toLowerCase())
      : null;
    const intBit = intensityLabel
      ? labels.epureImpressionIntensity.replace(
          "{intensity}",
          intensityLabel.toLowerCase(),
        )
      : null;
    const limBit = limpidityLabel
      ? labels.epureImpressionLimpid.replace(
          "{limpidity}",
          limpidityLabel.toLowerCase(),
        )
      : null;
    const parts = [colorBit, intBit, limBit].filter(Boolean);
    if (parts.length === 0) return labels.epureImpressionEmpty;
    if (parts.length === 1) return `« ${parts[0]}. »`;
    if (parts.length === 2) return `« ${parts[0]}, ${parts[1]}. »`;
    return `« ${parts[0]}, ${parts[1]},\net ${parts[2]}. »`;
  }, [
    selectedColorLabel,
    intensityLabel,
    limpidityLabel,
    labels,
  ]);

  const metaLine = [
    draft.vintage.trim() || null,
    draft.wine_origin.trim() || null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const saveDraft = () => {
    setDraftFlash(true);
    window.setTimeout(() => setDraftFlash(false), 2200);
  };

  if (!hydrated || !draft.wine_name.trim()) {
    return (
      <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] lg:-mx-8" />
    );
  }

  return (
    <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] bg-[#f8f5ef] text-[#3b2c2b] lg:-mx-8">
      {/* Hero */}
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

      {/* Stepper */}
      <section className="mx-auto w-full max-w-[1440px] px-6 py-7 sm:px-8 lg:px-24">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#7d7169]">
            {labels.epureStepperLabel}
          </p>
          <p className="text-[11px] text-[#7d7169]">{labels.epureStepOf}</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(
            [
              {
                n: "01",
                title: labels.epureStepVisual,
                sub: labels.epureStepVisualSub,
                active: true,
              },
              {
                n: "02",
                title: labels.epureStepNose,
                sub: labels.epureStepNoseSub,
                active: false,
              },
              {
                n: "03",
                title: labels.epureStepMouth,
                sub: labels.epureStepMouthSub,
                active: false,
              },
            ] as const
          ).map((s) => (
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
                    : "bg-[#eae4db] text-[#80746e]",
                )}
              >
                {s.n}
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

      {/* Atelier */}
      <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-6 pb-10 sm:px-8 lg:grid-cols-[minmax(0,824px)_minmax(0,400px)] lg:justify-between lg:px-24 lg:gap-6">
        {/* Main card */}
        <div className="rounded-[12px] border border-[#e7e0d7] bg-white p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-[#8a4354]">
            {labels.epureVisualKicker}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-[clamp(1.75rem,3vw,2.3125rem)] font-normal leading-none text-[#3b2c2b]">
            {labels.epureVisualTitle}
          </h2>
          <p className="mt-3 text-[13px] text-[#80716b]">{labels.epureVisualLead}</p>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureColorQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">{labels.epureColorLead}</p>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {EPURE_EYE_COLORS.map((c) => {
              const active = draft.eye_color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => patch({ eye_color: c.id })}
                  className={cn(
                    "relative flex h-[101px] flex-col items-center rounded-[8px] pt-3",
                    active
                      ? "border border-[#752e42] bg-[#faf2f1]"
                      : "bg-white",
                  )}
                >
                  {active ? (
                    <span className="absolute right-2 top-1.5 text-[11px] font-semibold text-[#752e42]">
                      ✓
                    </span>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.asset}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11"
                  />
                  <span
                    className={cn(
                      "mt-3 text-[12px]",
                      active
                        ? "font-semibold text-[#752e42]"
                        : "font-normal text-[#756a64]",
                    )}
                  >
                    {labels[c.labelKey]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureIntensityQ}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <OptionBtn
              active={intensity === "light"}
              label={labels.intensityPale}
              onClick={() => patch({ eye_intensity: "light" as EyeIntensity })}
              className="w-full justify-start"
            />
            <OptionBtn
              active={intensity === "medium"}
              label={labels.intensityMedium}
              onClick={() =>
                patch({ eye_intensity: "medium" as EyeIntensity })
              }
              className="w-full justify-start"
            />
            <OptionBtn
              active={intensity === "intense"}
              label={labels.intensityIntense}
              onClick={() =>
                patch({ eye_intensity: "intense" as EyeIntensity })
              }
              className="w-full justify-start"
            />
          </div>

          <p className="mt-7 text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureAppearQ}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <OptionBtn
              active={limpidity === "limpid"}
              label={labels.limpidClear}
              onClick={() => patch({ eye_robe: "limpid" as EyeLimpidity })}
            />
            <OptionBtn
              active={limpidity === "slightly_cloudy"}
              label={labels.limpidSlight}
              onClick={() =>
                patch({ eye_robe: "slightly_cloudy" as EyeLimpidity })
              }
            />
            <OptionBtn
              active={limpidity === "cloudy"}
              label={labels.limpidCloudy}
              onClick={() => patch({ eye_robe: "cloudy" as EyeLimpidity })}
            />
          </div>

          <p className="mt-6 text-[11px] text-[#8a7c73]">{labels.epureReassure}</p>

          <div className="my-5 h-px bg-[#ece6df]" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={saveDraft}
              className="text-left text-[11px] text-[#75816f]"
            >
              ✓{"  "}
              {draftFlash ? labels.eyeDraftSaved : labels.epureDraftIdle}
            </button>
            <Link
              href="/degustation/nez/start"
              className="inline-flex h-11 w-full items-center justify-between rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white sm:w-[264px]"
            >
              <span>{labels.epureContinueNose}</span>
              <span aria-hidden className="text-[20px] font-normal">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-[20px]">
          <div className="rounded-[10px] bg-[#eee8de] p-6">
            <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-[#837361]">
              {labels.epureGlassLabel}
            </p>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-[32px] leading-none text-[#3b2c2b]">
              {draft.wine_name}
            </p>
            {metaLine ? (
              <p className="mt-3 text-[12px] text-[#776a60]">{metaLine}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex h-[25px] items-center rounded-[4px] bg-[#e4d6d3] px-3 text-[10px] font-medium text-[#752e42]">
                {labels.epureWineTypeRed}
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
              {labels.epureTipTitle1}
              <br />
              {labels.epureTipTitle2}
            </p>
            <div className="mt-8 space-y-5">
              <div className="flex gap-3">
                <span className="text-[12px] font-semibold text-[#9d8059]">
                  01
                </span>
                <p className="whitespace-pre-line text-[12px] leading-normal text-[#726451]">
                  {labels.epureTip1}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[12px] font-semibold text-[#9d8059]">
                  02
                </span>
                <p className="whitespace-pre-line text-[12px] leading-normal text-[#726451]">
                  {labels.epureTip2}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#e7e0d7] bg-white p-6">
            <p className="text-[10px] font-medium uppercase tracking-[1.2px] text-[#83766c]">
              {labels.epureNotebookLabel}
            </p>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-[27px] leading-none text-[#3b2c2b]">
              {labels.epureNotebookTitle}
            </p>
            <p className="mt-4 whitespace-pre-line font-[family-name:var(--font-cormorant)] text-[14px] italic leading-normal text-[#6b5955]">
              {impression}
            </p>
            <div className="my-5 h-px bg-[#ece6df]" />
            <p className="text-[11px] text-[#8a7b70]">{labels.epureNotebookHint}</p>
          </div>
        </div>
      </section>

      {/* Footer strip */}
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
