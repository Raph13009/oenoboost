"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EpureOptionBtn } from "@/features/degustation/components/tasting/epure-option-btn";
import { EpureTastingShell } from "@/features/degustation/components/tasting/epure-tasting-shell";
import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  isWineTypeId,
  type WineTypeId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

const AROMAS: { id: string; key: keyof Dictionary["tastingFlow"] }[] = [
  { id: "Fruity", key: "aromaFruity" },
  { id: "Floral", key: "aromaFloral" },
  { id: "Spicy", key: "aromaSpicy" },
  { id: "Woody", key: "aromaWoody" },
  { id: "Mineral", key: "aromaMineral" },
  { id: "Vegetal", key: "aromaVegetal" },
  { id: "Fermented", key: "aromaFermented" },
];

type Props = {
  labels: Dictionary["tastingFlow"];
};

export function NoseTastingClient({ labels }: Props) {
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
  const families = draft.nose_aroma_families ?? [];

  const wineTypeLabel =
    wineType === "white"
      ? labels.wineTypeWhite
      : wineType === "red"
        ? labels.wineTypeRed
        : wineType === "rose"
          ? labels.wineTypeRose
          : labels.epureWineTypeRed;

  const toggleAroma = (id: string) => {
    const next = families.includes(id)
      ? families.filter((x) => x !== id)
      : [...families, id];
    patch({ nose_aroma_families: next });
  };

  const intensityLabel =
    draft.nose_intensity === "light"
      ? labels.noseIntLow
      : draft.nose_intensity === "medium"
        ? labels.noseIntMid
        : draft.nose_intensity === "pronounced"
          ? labels.noseIntHigh
          : null;

  const aromaLabels = families
    .map((id) => {
      const hit = AROMAS.find((a) => a.id === id);
      return hit ? String(labels[hit.key]) : id;
    })
    .filter(Boolean);

  const impression = useMemo(() => {
    const first = draft.nose_first_nose?.trim();
    const firstBit = first
      ? labels.epureImpressionNoseFirst.replace(
          "{note}",
          first.length > 48 ? `${first.slice(0, 48)}…` : first.toLowerCase(),
        )
      : null;
    const aromaBit =
      aromaLabels.length > 0
        ? labels.epureImpressionNoseAromas.replace(
            "{aromas}",
            aromaLabels.map((a) => a.toLowerCase()).join(", "),
          )
        : null;
    const intBit = intensityLabel
      ? labels.epureImpressionNoseIntensity.replace(
          "{intensity}",
          intensityLabel.toLowerCase(),
        )
      : null;
    const parts = [firstBit, aromaBit, intBit].filter(Boolean);
    if (parts.length === 0) return labels.epureImpressionEmpty;
    if (parts.length === 1) return `« ${parts[0]}. »`;
    if (parts.length === 2) return `« ${parts[0]}, ${parts[1]}. »`;
    return `« ${parts[0]}, ${parts[1]},\net ${parts[2]}. »`;
  }, [draft.nose_first_nose, aromaLabels, intensityLabel, labels]);

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

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseFirstQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseFirstLead}
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

        <div className="my-6 h-px bg-[#ece6df]" />

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseSecondQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseSecondLead}
        </p>
        <textarea
          value={draft.nose_second_nose ?? ""}
          onChange={(e) =>
            patch({ nose_second_nose: e.target.value || null })
          }
          placeholder={labels.noseSecondPlaceholder}
          rows={3}
          className="mt-4 w-full resize-none rounded-[8px] border border-[#ddd6cc] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398] focus-visible:border-[#752e42]/40"
        />

        <div className="my-6 h-px bg-[#ece6df]" />

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseAromaQ}
        </p>
        <p className="mt-2 text-[12px] text-[#80716b]">
          {labels.epureNoseAromaLead}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {AROMAS.map((a) => {
            const on = families.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAroma(a.id)}
                className={cn(
                  "inline-flex h-[42px] items-center rounded-[6px] border px-[18px] text-[12px] transition-colors",
                  on
                    ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
                    : "border-[#ddd6cc] bg-white font-normal text-[#6c615c]",
                )}
              >
                {on ? `${labels[a.key]}  ✓` : labels[a.key]}
              </button>
            );
          })}
        </div>

        <div className="my-6 h-px bg-[#ece6df]" />

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.epureNoseIntensityQ}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <EpureOptionBtn
            active={draft.nose_intensity === "light"}
            label={labels.noseIntLow}
            onClick={() => patch({ nose_intensity: "light" })}
            className="w-full justify-start"
          />
          <EpureOptionBtn
            active={draft.nose_intensity === "medium"}
            label={labels.noseIntMid}
            onClick={() => patch({ nose_intensity: "medium" })}
            className="w-full justify-start"
          />
          <EpureOptionBtn
            active={draft.nose_intensity === "pronounced"}
            label={labels.noseIntHigh}
            onClick={() => patch({ nose_intensity: "pronounced" })}
            className="w-full justify-start"
          />
        </div>

        <div className="my-6 h-px bg-[#ece6df]" />

        <p className="text-[16px] font-semibold text-[#3b2c2b]">
          {labels.labelNotes}
        </p>
        <textarea
          value={draft.nose_notes ?? ""}
          onChange={(e) => patch({ nose_notes: e.target.value || null })}
          placeholder={labels.noseNotesPlaceholder}
          rows={3}
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
