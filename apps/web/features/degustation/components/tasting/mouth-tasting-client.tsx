"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FavoritesAuthModal,
  type FavoritesAuthModalCopy,
} from "@/components/shared/favorites-auth-modal";
import { saveTastingSheetAction } from "@/features/degustation/actions/tasting-sheet-actions";
import { AromaFamilyPicker } from "@/features/degustation/components/tasting/aroma-family-picker";
import { EpureOptionBtn } from "@/features/degustation/components/tasting/epure-option-btn";
import { EpureTastingShell } from "@/features/degustation/components/tasting/epure-tasting-shell";
import { aromaLabel } from "@/features/degustation/tasting/aroma-catalog";
import {
  MOUTH_ATTACK_OPTIONS,
  MOUTH_FINISH_OPTIONS,
  MOUTH_TEXTURE_OPTIONS,
} from "@/features/degustation/tasting/mouth-options";
import { draftToInsert } from "@/features/degustation/tasting/tasting-draft";
import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  isWineTypeId,
  type WineTypeId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

const SAVE_AFTER_AUTH_PATH = "/degustation/bouche/start?save=1";

type Props = {
  labels: Dictionary["tastingFlow"];
  locale?: "fr" | "en";
  isLoggedIn?: boolean;
  autoSaveAfterAuth?: boolean;
  authCopy?: FavoritesAuthModalCopy;
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

function attackLabelOf(
  id: string | null,
  labels: Dictionary["tastingFlow"],
): string | null {
  if (!id) return null;
  const hit = MOUTH_ATTACK_OPTIONS.find((o) => o.id === id);
  if (hit) return String(labels[hit.labelKey]);
  if (id === "soft") return labels.attackSoft;
  if (id === "medium") return labels.attackMedium;
  if (id === "strong") return labels.attackStrong;
  return id;
}

export function MouthTastingClient({
  labels,
  locale = "fr",
  isLoggedIn = false,
  autoSaveAfterAuth = false,
  authCopy,
}: Props) {
  const router = useRouter();
  const { draft, hydrated, patch, reset } = useTastingFlow();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const autoSaveTried = useRef(false);

  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(SAVE_AFTER_AUTH_PATH)}`,
    [],
  );
  const registerHref = useMemo(
    () => `/signup?next=${encodeURIComponent(SAVE_AFTER_AUTH_PATH)}`,
    [],
  );

  useEffect(() => {
    if (!hydrated || saved) return;
    if (!draft.wine_name.trim() || !isWineTypeId(draft.wine_type)) {
      router.replace("/degustation/vin/start");
    }
  }, [hydrated, saved, draft.wine_name, draft.wine_type, router]);

  const wineType = draft.wine_type as WineTypeId | null;
  const flavours = useMemo(
    () => draft.mouth_flavours ?? [],
    [draft.mouth_flavours],
  );
  const textures = useMemo(
    () => draft.mouth_texture ?? [],
    [draft.mouth_texture],
  );

  const wineTypeLabel =
    wineType === "white"
      ? labels.wineTypeWhite
      : wineType === "red"
        ? labels.wineTypeRed
        : wineType === "rose"
          ? labels.wineTypeRose
          : labels.epureWineTypeRed;

  const attackLabel = attackLabelOf(draft.mouth_attack, labels);

  const finishLabel =
    draft.mouth_finish === "short"
      ? labels.finishShort
      : draft.mouth_finish === "medium"
        ? labels.finishMedium
        : draft.mouth_finish === "long"
          ? labels.finishLong
          : null;

  const toggleTexture = (id: string) => {
    const next = textures.includes(id)
      ? textures.filter((x) => x !== id)
      : [...textures, id];
    patch({ mouth_texture: next });
  };

  const impression = useMemo(() => {
    const flavourBit =
      flavours.length > 0
        ? labels.epureImpressionMouthFlavours.replace(
            "{flavours}",
            flavours
              .slice(0, 3)
              .map((id) => aromaLabel(id, locale).toLowerCase())
              .join(", "),
          )
        : null;
    const parts = [
      attackLabel
        ? labels.epureImpressionMouthAttack.replace(
            "{attack}",
            attackLabel.toLowerCase(),
          )
        : null,
      flavourBit,
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
  }, [attackLabel, flavours, finishLabel, labels, locale]);

  const metaLine = [
    draft.vintage.trim() || null,
    draft.wine_origin.trim() || null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const onSave = useCallback(async () => {
    setErr(null);

    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    setPending(true);
    const payload = draftToInsert(draft);
    const res = await saveTastingSheetAction(payload);
    setPending(false);
    if (!res.ok) {
      if (res.error === "AUTH_REQUIRED") {
        setAuthOpen(true);
        return;
      }
      setErr(res.message ?? "Error");
      return;
    }
    // Clear draft only after a successful save — keeps guest tasting intact through auth.
    reset();
    setSaved(true);
  }, [draft, isLoggedIn, reset]);

  useEffect(() => {
    if (!autoSaveAfterAuth || !hydrated || !isLoggedIn) return;
    if (autoSaveTried.current || saved || pending) return;
    if (!draft.wine_name.trim() || !isWineTypeId(draft.wine_type)) return;
    autoSaveTried.current = true;
    const t = window.setTimeout(() => {
      void onSave();
    }, 0);
    return () => window.clearTimeout(t);
  }, [
    autoSaveAfterAuth,
    hydrated,
    isLoggedIn,
    saved,
    pending,
    draft.wine_name,
    draft.wine_type,
    onSave,
  ]);

  if (saved) {
    return (
      <div className="epure-page vs-bleed -mx-6 -mt-5 flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[#f8f5ef] px-6 lg:-mx-8">
        <div
          className="w-full max-w-md rounded-[12px] border border-[#e7e0d7] bg-white px-8 py-10 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#8a4354]">
            OenoBoost
          </p>
          <p
            className="mx-auto mt-5 grid size-14 place-items-center rounded-full bg-[#752e42] text-[22px] font-semibold text-white"
            aria-hidden
          >
            ✓
          </p>
          <p className="mt-6 font-[family-name:var(--font-cormorant)] text-[clamp(1.8rem,4vw,2.4rem)] leading-none text-[#3b2c2b]">
            {labels.successTitle}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[#80716b]">
            {labels.successBody}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-between rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white"
            >
              <span>{labels.backHome}</span>
              <span aria-hidden className="text-[20px] font-normal">
                →
              </span>
            </Link>
            <Link
              href="/degustation/history"
              className="inline-flex h-11 w-full items-center justify-center rounded-[6px] border border-[#ddd6cc] bg-[#f8f5ef] px-[18px] text-[13px] text-[#65594f]"
            >
              {labels.backDegustation}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated || !draft.wine_name.trim() || !wineType) {
    return (
      <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] lg:-mx-8" />
    );
  }

  return (
    <>

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
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthAttackLead}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MOUTH_ATTACK_OPTIONS.map((o) => (
              <EpureOptionBtn
                key={o.id}
                active={draft.mouth_attack === o.id}
                label={labels[o.labelKey]}
                onClick={() => patch({ mouth_attack: o.id })}
              />
            ))}
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthMidQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthMidLead}
          </p>

          <p className="mt-5 text-[14px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthFlavoursQ}
          </p>
          <div className="mt-3">
            <AromaFamilyPicker
              selected={flavours}
              onChange={(next) => patch({ mouth_flavours: next })}
              locale={locale}
              lead={labels.epureMouthFlavoursLead}
            />
          </div>

          <p className="mt-7 text-[14px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthTextureQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthTextureLead}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MOUTH_TEXTURE_OPTIONS.map((o) => {
              const on = textures.includes(o.id);
              return (
                <EpureOptionBtn
                  key={o.id}
                  active={on}
                  label={labels[o.labelKey]}
                  onClick={() => toggleTexture(o.id)}
                />
              );
            })}
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
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthFinishQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthFinishLead}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MOUTH_FINISH_OPTIONS.map((o) => (
              <EpureOptionBtn
                key={o.id}
                active={draft.mouth_finish === o.id}
                label={labels[o.labelKey]}
                onClick={() => patch({ mouth_finish: o.id })}
                className="w-full justify-start"
              />
            ))}
          </div>
          <div className="mt-5 rounded-[10px] bg-[#f8f5ef] p-5">
            <EpureRange
              label={labels.sliderLength}
              value={draft.mouth_length_caudalie ?? 5}
              onChange={(n) => patch({ mouth_length_caudalie: n })}
              hint={labels.lengthScale}
            />
          </div>

          <div className="my-6 h-px bg-[#ece6df]" />

          <p className="text-[16px] font-semibold text-[#3b2c2b]">
            {labels.epureMouthConclusionQ}
          </p>
          <p className="mt-2 text-[12px] text-[#80716b]">
            {labels.epureMouthConclusionLead}
          </p>
          <textarea
            value={draft.mouth_notes ?? ""}
            onChange={(e) => patch({ mouth_notes: e.target.value || null })}
            placeholder={labels.mouthConclusionPlaceholder}
            rows={4}
            className="mt-4 w-full resize-none rounded-[8px] border border-[#ddd6cc] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#3b2c2b] outline-none placeholder:text-[#b0a398] focus-visible:border-[#752e42]/40"
          />

          <p className="mt-6 text-[11px] text-[#8a7c73]">{labels.epureReassure}</p>

          <div className="my-5 h-px bg-[#ece6df]" />

          {err ? (
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-[13px] text-[#752e42]">{err}</p>
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
              onClick={() => void onSave()}
              className={cn(
                "inline-flex h-11 w-full items-center justify-between rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white sm:w-[264px]",
                (pending || saved) && "opacity-70",
              )}
            >
              <span>
                {pending
                  ? labels.saving
                  : isLoggedIn
                    ? labels.save
                    : labels.loginToSave}
              </span>
              <span aria-hidden className="text-[20px] font-normal">
                →
              </span>
            </button>
          </div>
        </div>
      </EpureTastingShell>

      {authCopy ? (
        <FavoritesAuthModal
          open={authOpen}
          onOpenChange={setAuthOpen}
          copy={authCopy}
          loginHref={loginHref}
          registerHref={registerHref}
        />
      ) : null}
    </>
  );
}
