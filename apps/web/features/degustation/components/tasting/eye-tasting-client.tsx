"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useTastingFlow } from "@/features/degustation/tasting/tasting-flow-context";
import {
  WINE_COLOR_GROUPS,
  colorLabelKey,
  type WineColorId,
} from "@/features/degustation/tasting/wine-colors";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["tastingFlow"];
};

type FamilyKey = "groupWhite" | "groupRose" | "groupRed";

function ChoicePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={cn(
        "vs-chip inline-flex items-center gap-2 text-left",
        active ? "font-semibold" : "text-[#74685f]",
      )}
    >
      {active ? <span aria-hidden>✓</span> : null}
      {label}
    </button>
  );
}

export function EyeTastingClient({ labels }: Props) {
  const { draft, patch } = useTastingFlow();
  const [family, setFamily] = useState<FamilyKey>("groupRed");
  const [draftFlash, setDraftFlash] = useState(false);

  const colorLabel = (id: WineColorId) => {
    const k = colorLabelKey(id) as keyof Dictionary["tastingFlow"];
    return labels[k] ?? id;
  };

  const selectedColorLabel = draft.eye_color
    ? colorLabel(draft.eye_color as WineColorId)
    : null;

  const summary = useMemo(() => {
    const parts = [
      selectedColorLabel,
      draft.eye_robe === "pale"
        ? labels.robePale
        : draft.eye_robe === "medium"
          ? labels.robeMedium
          : draft.eye_robe === "deep"
            ? labels.robeDeep
            : null,
      draft.eye_intensity === "light"
        ? labels.intensityLight
        : draft.eye_intensity === "medium"
          ? labels.intensityMedium
          : draft.eye_intensity === "intense"
            ? labels.intensityIntense
            : null,
      draft.eye_tears === "none"
        ? labels.tearsNone
        : draft.eye_tears === "light"
          ? labels.tearsLight
          : draft.eye_tears === "pronounced"
            ? labels.tearsPronounced
            : null,
    ].filter(Boolean);
    return parts.join("  ·  ");
  }, [draft, labels, selectedColorLabel]);

  const saveDraft = () => {
    setDraftFlash(true);
    window.setTimeout(() => setDraftFlash(false), 1800);
  };

  return (
    <div className="vs-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] pb-28 lg:-mx-8">
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-10 pt-8 sm:px-8 lg:px-10">
        <p className="vs-eyebrow">{labels.eyeBreadcrumb}</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <h1 className="font-heading text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[#38292b]">
              {labels.eyeHeroTitleBefore}
              <br />
              {labels.eyeHeroTitleAfter}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--vs-muted)]">
              {labels.eyeHeroLead}
            </p>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: "01", label: labels.eyeStepVisual, active: true },
                { n: "02", label: labels.eyeStepNose, active: false },
                { n: "03", label: labels.eyeStepMouth, active: false },
              ].map((step) => (
                <div
                  key={step.n}
                  className={cn(
                    "rounded-[10px] px-3 py-3",
                    step.active
                      ? "bg-[#eae0db] text-[var(--vs-ink)]"
                      : "text-[#8a8075]",
                  )}
                >
                  <p className="text-[10px] font-medium">{step.n}</p>
                  <p className="mt-1 font-heading text-[15px] sm:text-[17px]">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vs-ink)]">
              {labels.eyeHintTitle}
            </p>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--vs-muted)]">
              {labels.eyeHintBody}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-[10px] bg-[var(--vs-chip)] px-4 py-3 sm:grid-cols-[1.2fr_0.7fr_auto] sm:items-center sm:px-5">
          <label className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74685f]">
              {labels.wineNameLabel}
            </span>
            <input
              value={draft.wine_name}
              onChange={(e) => patch({ wine_name: e.target.value })}
              placeholder={labels.eyeWinePlaceholder}
              className="mt-1 w-full border-0 bg-transparent text-sm text-[#38292b] outline-none placeholder:text-[#8a7d70]"
            />
          </label>
          <label className="min-w-0 border-t border-[#d6cdbf] pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74685f]">
              {labels.vintageLabel}
            </span>
            <input
              value={draft.vintage}
              onChange={(e) => patch({ vintage: e.target.value })}
              placeholder={labels.eyeVintagePlaceholder}
              inputMode="numeric"
              className="mt-1 w-full border-0 bg-transparent text-sm text-[#38292b] outline-none placeholder:text-[#8a7d70]"
            />
          </label>
          <p className="hidden text-[11px] text-[#74685f] lg:block">
            {labels.eyeWineHint}
          </p>
        </div>

        <section className="vs-card mt-8 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] font-medium text-[#936e59]">01</span>
                <h2 className="font-heading text-[1.55rem] font-medium text-[#38292b] sm:text-[1.75rem]">
                  {labels.eyeRobeTitle}
                </h2>
              </div>
              <p className="mt-2 max-w-xl text-[13px] text-[var(--vs-muted)]">
                {labels.eyeRobeLead}
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-[#f2eee6] p-1">
              {(
                [
                  ["groupWhite", labels.groupWhite],
                  ["groupRed", labels.groupRed],
                  ["groupRose", labels.groupRose],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFamily(key)}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs transition-colors sm:px-4",
                    family === key
                      ? "bg-[var(--vs-ink)] font-semibold text-white"
                      : "text-[#74685f]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-7">
            {WINE_COLOR_GROUPS.map((g) => {
              const activeFamily = family === g.groupKey;
              return (
                <div
                  key={g.groupKey}
                  className={cn(
                    "rounded-xl px-2 py-3 transition-colors sm:px-3",
                    activeFamily ? "bg-[rgba(105,44,64,0.05)]" : "opacity-80",
                  )}
                >
                  <p className="font-heading text-lg text-[#65594f]">
                    {labels[g.groupKey]}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {g.colors.map((c) => {
                      const active = draft.eye_color === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            patch({ eye_color: c.id });
                            setFamily(g.groupKey);
                          }}
                          className="group flex flex-col items-center gap-2"
                        >
                          <span
                            className={cn(
                              "relative grid h-12 w-[62px] place-items-center rounded-[25px_19px_28px_18px] shadow-inner transition-transform",
                              active &&
                                "ring-2 ring-[var(--vs-ink)] ring-offset-2 ring-offset-[var(--vs-card)]",
                            )}
                            style={{ backgroundColor: c.hex }}
                          >
                            {active ? (
                              <span className="text-sm font-semibold text-white drop-shadow">
                                ✓
                              </span>
                            ) : null}
                          </span>
                          <span className="text-center text-[11px] text-[#74685f]">
                            {colorLabel(c.id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="vs-card p-5 sm:p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-medium text-[#936e59]">02</span>
              <h2 className="font-heading text-[1.45rem] font-medium">
                {labels.labelRobe}
              </h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ChoicePill
                active={draft.eye_robe === "pale"}
                label={labels.robePale}
                onClick={() => patch({ eye_robe: "pale" })}
              />
              <ChoicePill
                active={draft.eye_robe === "medium"}
                label={labels.robeMedium}
                onClick={() => patch({ eye_robe: "medium" })}
              />
              <ChoicePill
                active={draft.eye_robe === "deep"}
                label={labels.robeDeep}
                onClick={() => patch({ eye_robe: "deep" })}
              />
            </div>
          </section>

          <section className="vs-card p-5 sm:p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-medium text-[#936e59]">03</span>
              <h2 className="font-heading text-[1.45rem] font-medium">
                {labels.labelIntensity}
              </h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ChoicePill
                active={draft.eye_intensity === "light"}
                label={labels.intensityLight}
                onClick={() => patch({ eye_intensity: "light" })}
              />
              <ChoicePill
                active={draft.eye_intensity === "medium"}
                label={labels.intensityMedium}
                onClick={() => patch({ eye_intensity: "medium" })}
              />
              <ChoicePill
                active={draft.eye_intensity === "intense"}
                label={labels.intensityIntense}
                onClick={() => patch({ eye_intensity: "intense" })}
              />
            </div>
          </section>
        </div>

        <section className="vs-card mt-5 p-5 sm:p-6">
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] font-medium text-[#936e59]">04</span>
            <h2 className="font-heading text-[1.45rem] font-medium">
              {labels.labelTears}
            </h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ChoicePill
              active={draft.eye_tears === "none"}
              label={labels.tearsNone}
              onClick={() => patch({ eye_tears: "none" })}
            />
            <ChoicePill
              active={draft.eye_tears === "light"}
              label={labels.tearsLight}
              onClick={() => patch({ eye_tears: "light" })}
            />
            <ChoicePill
              active={draft.eye_tears === "pronounced"}
              label={labels.tearsPronounced}
              onClick={() => patch({ eye_tears: "pronounced" })}
            />
          </div>
          <div className="mt-6 rounded-[10px] bg-[var(--vs-chip)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#74685f]">
              {labels.eyeTearsTipTitle}
            </p>
            <p className="mt-1 text-[13px] text-[var(--vs-muted)]">
              {labels.eyeTearsTipBody}
            </p>
          </div>
        </section>

        <section className="vs-card mt-5 grid gap-6 p-5 sm:grid-cols-[0.85fr_1.15fr] sm:p-6">
          <div>
            <p className="vs-eyebrow text-[var(--vs-ink)]">
              {labels.eyeConclusionEyebrow}
            </p>
            <h2 className="mt-2 font-heading text-[1.7rem] font-medium">
              {labels.eyeConclusionTitle}
            </h2>
            <p className="mt-3 max-w-[16rem] text-sm text-[var(--vs-muted)]">
              {labels.eyeConclusionLead}
            </p>
            <p className="mt-8 text-[13px] text-[#74685f]">
              {labels.eyeConclusionHint}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--vs-border)] bg-white/70 p-4 sm:p-5">
            <textarea
              value={draft.eye_notes ?? ""}
              onChange={(e) => patch({ eye_notes: e.target.value || null })}
              placeholder={labels.eyeNotesPlaceholder}
              rows={4}
              className="w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-[#8a7d70]"
            />
            <div className="mt-4 border-t border-[var(--vs-border)] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#74685f]">
                {labels.eyeObservationsLabel}
              </p>
              <p className="mt-1 text-[13px] text-[#65594f]">
                {summary || "—"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--vs-muted)]">
            {labels.eyeFooterMark}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button type="button" onClick={saveDraft} className="vs-btn-ghost">
              {draftFlash ? labels.eyeDraftSaved : labels.eyeSaveDraft}
            </button>
            <Link href="/degustation/nez/start" className="vs-btn-primary">
              {labels.eyeContinueNose} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
        <p className="mt-4 text-right text-[12px] text-[#8a8075]">
          {labels.eyeProgress}
        </p>
      </div>
    </div>
  );
}
