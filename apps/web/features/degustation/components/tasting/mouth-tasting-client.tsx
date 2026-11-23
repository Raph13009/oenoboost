"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { saveTastingSheetAction } from "@/features/degustation/actions/tasting-sheet-actions";
import { EpureOptionBtn } from "@/features/degustation/components/tasting/epure-option-btn";
import { EpureTastingShell } from "@/features/degustation/components/tasting/epure-tasting-shell";
import { draftToInsert } from "@/features/degustation/tasting/tasting-draft";
import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  isWineTypeId,
  type WineTypeId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
  loginLabel: string;
};

function EpureRange({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[#3b2c2b]">{label}</span>
        <span className="tabular-nums text-[13px] font-semibold text-[#752e42]">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e7e0d7] accent-[#752e42]"
      />
      {hint ? (
        <p className="text-[11px] leading-snug text-[#8a7c73]">{hint}</p>
      ) : null}
    </div>
  );
}

export function MouthTastingClient({ labels, loginLabel }: Props) {
  const router = useRouter();
  const { draft, hydrated, patch, reset } = useTastingFlow();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.wine_name.trim() || !isWineTypeId(draft.wine_type)) {
      router.replace("/degustation/vin/start");
    }
  }, [hydrated, draft.wine_name, draft.wine_type, router]);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => {
      router.replace("/degustation");
    }, 1400);
    return () => window.clearTimeout(t);
  }, [saved, router]);

  const wineType = draft.wine_type as WineTypeId | null;

  const wineTypeLabel =
    wineType === "white"
      ? labels.wineTypeWhite
      : wineType === "red"
        ? labels.wineTypeRed
        : wineType === "rose"
          ? labels.wineTypeRose
          : labels.epureWineTypeRed;

  const attackLabel =
    draft.mouth_attack === "soft"
      ? labels.attackSoft
      : draft.mouth_attack === "medium"
        ? labels.attackMedium
        : draft.mouth_attack === "strong"
          ? labels.attackStrong
          : null;

  const midLabel =
    draft.mouth_mid === "light"
      ? labels.midLight
      : draft.mouth_mid === "round"
        ? labels.midRound
        : draft.mouth_mid === "full"
          ? labels.midFull
          : null;

  const finishLabel =
    draft.mouth_finish === "short"
      ? labels.finishShort
      : draft.mouth_finish === "medium"
        ? labels.finishMedium
        : draft.mouth_finish === "long"
          ? labels.finishLong
          : null;

  const impression = useMemo(() => {
    const parts = [
      attackLabel
        ? labels.epureImpressionMouthAttack.replace(
            "{attack}",
            attackLabel.toLowerCase(),
          )
        : null,
      midLabel
        ? labels.epureImpressionMouthMid.replace(
            "{mid}",
            midLabel.toLowerCase(),
          )
        : null,
      finishLabel
        ? labels.epureImpressionMouthFinish.replace(
            "{finish}",
            finishLabel.toLowerCase(),
          )
        : null,
    ].filter(Boolean);
    if (parts.length === 0) return labels.epureImpressionEmpty;
    if (parts.length === 1) return `« ${parts[0]}. »`;
    if (parts.length === 2) return `« ${parts[0]}, ${parts[1]}. »`;
    return `« ${parts[0]}, ${parts[1]},\net ${parts[2]}. »`;
  }, [attackLabel, midLabel, finishLabel, labels]);

  const metaLine = [
    draft.vintage.trim() || null,
    draft.wine_origin.trim() || null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const onSave = async () => {
    setErr(null);
    setPending(true);
    const payload = draftToInsert(draft);
    const res = await saveTastingSheetAction(payload);
    setPending(false);
    if (!res.ok) {
      if (res.error === "AUTH_REQUIRED") {
        setErr(labels.loginToSave);
        return;
      }
      setErr(res.message ?? "Error");
      return;
    }
    reset();
    setSaved(true);
  };

  if (!hydrated || !draft.wine_name.trim() || !wineType) {
    return (
      <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] lg:-mx-8" />
    );
  }

  return (
    <>
      {saved ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#352629]/85 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div className="mx-6 max-w-sm rounded-[12px] border border-[#e7e0d7] bg-[#f8f5ef] px-8 py-10 text-center">
            <p className="font-[family-name:var(--font-cormorant)] text-[32px] leading-none text-[#752e42]">
              {labels.successTitle}
            </p>
            <p className="mt-4 text-[14px] text-[#80716b]">{labels.successBody}</p>
          </div>
        </div>
      ) : null}

      <EpureTastingShell
        labels={labels}
        step={3}
        wineName={draft.wine_name}
        metaLine={metaLine}
        wineTypeLabel={wineTypeLabel}
        tipTitle1={labels.epureMouthTipTitle1}
        tipTitle2={labels.epureMouthTipTitle2}
        tip1={labels.epureMouthTip1}
        tip2={labels.epureMouthTip2}
        notebookTitle={labels.epureMouthNotebookTitle}
        impression={impression}
        notebookHint={labels.epureMouthNotebookHint}
      >
        <div className="rounded-[12px] border border-[#e7e0d7] bg-white p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-[#8a4354]">
            {labels.epureMouthKicker}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-[clamp(1.75rem,3vw,2.3125rem)] font-normal leading-none text-[#3b2c2b]">
            {labels.epureMouthTitle}
          </h2>
          <p className="mt-3 text-[13px] text-[#80716b]">{labels.epureMouthLead}</p>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthAttackQ}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <EpureOptionBtn
              active={draft.mouth_attack === "soft"}
              label={labels.attackSoft}
              onClick={() => patch({ mouth_attack: "soft" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_attack === "medium"}
              label={labels.attackMedium}
              onClick={() => patch({ mouth_attack: "medium" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_attack === "strong"}
              label={labels.attackStrong}
              onClick={() => patch({ mouth_attack: "strong" })}
              className="w-full justify-start"
            />
          </div>

          <p className="mt-7 text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthMidQ}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <EpureOptionBtn
              active={draft.mouth_mid === "light"}
              label={labels.midLight}
              onClick={() => patch({ mouth_mid: "light" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_mid === "round"}
              label={labels.midRound}
              onClick={() => patch({ mouth_mid: "round" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_mid === "full"}
              label={labels.midFull}
              onClick={() => patch({ mouth_mid: "full" })}
              className="w-full justify-start"
            />
          </div>

          <p className="mt-7 text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthFinishQ}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <EpureOptionBtn
              active={draft.mouth_finish === "short"}
              label={labels.finishShort}
              onClick={() => patch({ mouth_finish: "short" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_finish === "medium"}
              label={labels.finishMedium}
              onClick={() => patch({ mouth_finish: "medium" })}
              className="w-full justify-start"
            />
            <EpureOptionBtn
              active={draft.mouth_finish === "long"}
              label={labels.finishLong}
              onClick={() => patch({ mouth_finish: "long" })}
              className="w-full justify-start"
            />
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthBalanceQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthBalanceLead}
          </p>
          <div className="mt-5 space-y-5 rounded-[10px] bg-[#f8f5ef] p-5">
            <EpureRange
              label={labels.sliderAcidity}
              value={draft.mouth_acidity ?? 5}
              onChange={(n) => patch({ mouth_acidity: n })}
            />
            <EpureRange
              label={labels.sliderTannins}
              value={draft.mouth_tannins ?? 5}
              onChange={(n) => patch({ mouth_tannins: n })}
            />
            <EpureRange
              label={labels.sliderAlcohol}
              value={draft.mouth_alcohol ?? 5}
              onChange={(n) => patch({ mouth_alcohol: n })}
            />
            <EpureRange
              label={labels.sliderSugar}
              value={draft.mouth_sugar ?? 5}
              onChange={(n) => patch({ mouth_sugar: n })}
            />
            <EpureRange
              label={labels.sliderLength}
              value={draft.mouth_length_caudalie ?? 5}
              onChange={(n) => patch({ mouth_length_caudalie: n })}
              hint={labels.lengthScale}
            />
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthNotesQ}
          </p>
          <textarea
            value={draft.mouth_notes ?? ""}
            onChange={(e) => patch({ mouth_notes: e.target.value || null })}
            placeholder={labels.mouthNotesPlaceholder}
            rows={4}
            className="mt-4 w-full resize-none rounded-[8px] border border-[#ddd6cc] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398] focus-visible:border-[#752e42]/40"
          />

          <p className="mt-6 text-[11px] text-[#8a7c73]">{labels.epureReassure}</p>

          <div className="my-5 h-px bg-[#ece6df]" />

          {err ? (
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-[13px] text-[#752e42]">{err}</p>
              {err === labels.loginToSave ? (
                <Link
                  href="/login?next=/degustation/bouche/start"
                  className="inline-flex h-11 w-fit items-center rounded-[6px] border border-[#752e42] px-[18px] text-[13px] text-[#752e42]"
                >
                  {loginLabel}
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/degustation/nez/start"
              className="inline-flex h-11 items-center justify-center rounded-[6px] border border-[#ddd6cc] bg-white px-[18px] text-[13px] text-[#65594f]"
            >
              {labels.epureBackNose}
            </Link>
            <button
              type="button"
              disabled={pending || saved}
              onClick={onSave}
              className={cn(
                "inline-flex h-11 w-full items-center justify-between rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white sm:w-[264px]",
                (pending || saved) && "opacity-70",
              )}
            >
              <span>{pending ? labels.saving : labels.save}</span>
              <span aria-hidden className="text-[20px] font-normal">
                →
              </span>
            </button>
          </div>
        </div>
      </EpureTastingShell>
    </>
  );
}
