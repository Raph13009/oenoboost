"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AromaFamilyPicker } from "@/features/degustation/components/tasting/aroma-family-picker";
import { EpureOptionBtn } from "@/features/degustation/components/tasting/epure-option-btn";
import { EpureTastingShell } from "@/features/degustation/components/tasting/epure-tasting-shell";
import {
  AROMA_FAMILIES,
  aromaLabel,
  type AromaFamilyId,
} from "@/features/degustation/tasting/aroma-catalog";
import {
  NOSE_INTENSITY_OPTIONS,
  NOSE_PLUS_OPTIONS,
} from "@/features/degustation/tasting/nose-options";
import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  isWineTypeId,
  type WineTypeId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
  locale?: "fr" | "en";
};

export function NoseTastingClient({ labels, locale = "fr" }: Props) {
  const router = useRouter();
  const { draft, hydrated, patch } = useTastingFlow();
  const [draftFlash, setDraftFlash] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.wine_name.trim() || !isWineTypeId(draft.wine_type)) {
      router.replace("/degustation/vin/start");
    }
  }, [hydrated, draft.wine_name, draft.wine_type, router]);

  const wineType = draft.wine_type as WineTypeId | null;
  const firstFamilies = useMemo(
    () => draft.nose_first_families ?? [],
    [draft.nose_first_families],
  );
  const secondAromas = useMemo(
    () => draft.nose_aroma_families ?? [],
    [draft.nose_aroma_families],
  );

  const wineTypeLabel =
    wineType === "white"
      ? labels.wineTypeWhite
      : wineType === "red"
        ? labels.wineTypeRed
        : wineType === "rose"
          ? labels.wineTypeRose
          : labels.epureWineTypeRed;

  const toggleFirstFamily = (id: AromaFamilyId) => {
    const next = firstFamilies.includes(id)
      ? firstFamilies.filter((x) => x !== id)
      : [...firstFamilies, id];
    patch({ nose_first_families: next });
  };

  const intensityLabelOf = (id: string | null) => {
    if (id === "light") return labels.noseIntLow;
    if (id === "medium") return labels.noseIntMid;
    if (id === "pronounced") return labels.noseIntHigh;
    return null;
  };

  const firstIntLabel = intensityLabelOf(draft.nose_first_intensity);
  const secondIntLabel = intensityLabelOf(draft.nose_intensity);

  const impression = useMemo(() => {
    const first = draft.nose_first_nose?.trim();
    const firstBit = first
      ? labels.epureImpressionNoseFirst.replace(
          "{note}",
          first.length > 48 ? `${first.slice(0, 48)}…` : first.toLowerCase(),
        )
      : null;
    const aromaBit =
      secondAromas.length > 0
        ? labels.epureImpressionNoseAromas.replace(
            "{aromas}",
            secondAromas
              .slice(0, 3)
              .map((id) => aromaLabel(id, locale).toLowerCase())
              .join(", "),
          )
        : null;
    const intBit = secondIntLabel
      ? labels.epureImpressionNoseIntensity.replace(
          "{intensity}",
          secondIntLabel.toLowerCase(),
        )
      : firstIntLabel
        ? labels.epureImpressionNoseIntensity.replace(
            "{intensity}",
            firstIntLabel.toLowerCase(),
          )
        : null;
    const parts = [firstBit, aromaBit, intBit].filter(Boolean);
    if (parts.length === 0) return labels.epureImpressionEmpty;
    if (parts.length === 1) return `« ${parts[0]}. »`;
    if (parts.length === 2) return `« ${parts[0]}, ${parts[1]}. »`;
    return `« ${parts[0]}, ${parts[1]},\net ${parts[2]}. »`;
  }, [
    draft.nose_first_nose,
    secondAromas,
    secondIntLabel,
    firstIntLabel,
    labels,
    locale,
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

  if (!hydrated || !draft.wine_name.trim() || !wineType) {
    return (
      <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] lg:-mx-8" />
    );
  }

  return (
    <EpureTastingShell
      labels={labels}
      step={2}
      wineName={draft.wine_name}
      metaLine={metaLine}
      wineTypeLabel={wineTypeLabel}
      tipTitle1={labels.epureNoseTipTitle1}
      tipTitle2={labels.epureNoseTipTitle2}
      tip1={labels.epureNoseTip1}
      tip2={labels.epureNoseTip2}
      notebookTitle={labels.epureNoseNotebookTitle}
      impression={impression}
      notebookHint={labels.epureNoseNotebookHint}
    >
      <div className="rounded-[12px] border border-[#e7e0d7] bg-white p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-[#8a4354]">
          {labels.epureNoseKicker}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-[clamp(1.75rem,3vw,2.3125rem)] font-normal leading-none text-[#3b2c2b]">
          {labels.epureNoseTitle}
        </h2>
        <p className="mt-3 text-[13px] text-[#80716b]">{labels.epureNoseLead}</p>

        <div className="my-6 h-px bg-[#ece6df]" />

        {/* Premier nez */}
        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseFirstQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseFirstLead}
        </p>
        <p className="mt-1 text-[12px] italic text-[#8a7c73]">
          {labels.epureNoseFirstPurpose}
        </p>
        <textarea
          value={draft.nose_first_nose ?? ""}
          onChange={(e) =>
            patch({ nose_first_nose: e.target.value || null })
          }
          placeholder={labels.noseFirstPlaceholder}
          rows={3}
          className="mt-4 w-full resize-none rounded-[8px] border border-[#ddd6cc] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398] focus-visible:border-[#752e42]/40"
        />

        <p className="mt-6 text-[14px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseFirstIntensityQ}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {NOSE_INTENSITY_OPTIONS.map((o) => (
            <EpureOptionBtn
              key={`first-${o.id}`}
              active={draft.nose_first_intensity === o.id}
              label={labels[o.labelKey]}
              onClick={() => patch({ nose_first_intensity: o.id })}
              className="w-full justify-start"
            />
          ))}
        </div>

        <p className="mt-6 text-[14px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseFirstFamiliesQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseFirstFamiliesLead}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {AROMA_FAMILIES.map((fam) => {
            const on = firstFamilies.includes(fam.id);
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => toggleFirstFamily(fam.id)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-[6px] border px-3 text-left text-[13px] transition-colors",
                  on
                    ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
                    : "border-[#ddd6cc] bg-white text-[#65594f]",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: fam.accent }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  {locale === "en" ? fam.labelEn : fam.labelFr}
                </span>
                {on ? <span className="text-[11px]">✓</span> : null}
              </button>
            );
          })}
        </div>

        <div className="my-6 h-px bg-[#ece6df]" />

        {/* Second nez */}
        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseSecondQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseSecondLead}
        </p>

        <p className="mt-5 text-[14px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseAromaQ}
        </p>
        <div className="mt-3">
          <AromaFamilyPicker
            selected={secondAromas}
            onChange={(next) => patch({ nose_aroma_families: next })}
            locale={locale}
            lead={labels.epureNoseAromaLead}
          />
        </div>

        <p className="mt-7 text-[14px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseIntensityQ}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {NOSE_INTENSITY_OPTIONS.map((o) => (
            <EpureOptionBtn
              key={`second-${o.id}`}
              active={draft.nose_intensity === o.id}
              label={labels[o.labelKey]}
              onClick={() => patch({ nose_intensity: o.id })}
              className="w-full justify-start"
            />
          ))}
        </div>

        <p className="mt-7 text-[14px] font-semibold text-[#3b2c2b]">
          {labels.epureNosePlusQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNosePlusLead}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {NOSE_PLUS_OPTIONS.map((o) => (
            <EpureOptionBtn
              key={o.id}
              active={draft.nose_plus === o.id}
              label={labels[o.labelKey]}
              onClick={() =>
                patch({
                  nose_plus: draft.nose_plus === o.id ? null : o.id,
                })
              }
            />
          ))}
        </div>

        <div className="my-6 h-px bg-[#ece6df]" />

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseConclusionQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseConclusionLead}
        </p>
        <textarea
          value={draft.nose_notes ?? ""}
          onChange={(e) => patch({ nose_notes: e.target.value || null })}
          placeholder={labels.noseConclusionPlaceholder}
          rows={4}
          className="mt-4 w-full resize-none rounded-[8px] border border-[#ddd6cc] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398] focus-visible:border-[#752e42]/40"
        />

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/degustation/oeil/start"
              className="inline-flex h-11 items-center justify-center rounded-[6px] border border-[#ddd6cc] bg-white px-[18px] text-[13px] text-[#65594f]"
            >
              {labels.epureBackVisual}
            </Link>
            <Link
              href="/degustation/bouche/start"
              className="inline-flex h-11 w-full items-center justify-between rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white sm:w-[264px]"
            >
              <span>{labels.epureContinueMouth}</span>
              <span aria-hidden className="text-[20px] font-normal">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </EpureTastingShell>
  );
}
