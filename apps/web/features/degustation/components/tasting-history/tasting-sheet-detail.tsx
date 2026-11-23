import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { buildAutoSummaryLine, computeTastingMood } from "@/features/degustation/utils/tasting-mood";
import { formatTastingMonthYear } from "@/features/degustation/utils/tasting-date";
import {
  parseIntensity,
  parseLimpidity,
  parseTears,
} from "@/features/degustation/tasting/eye-observations";
import {
  aromaLabel as catalogAromaLabel,
} from "@/features/degustation/tasting/aroma-catalog";
import {
  MOUTH_ATTACK_OPTIONS,
  MOUTH_TEXTURE_OPTIONS,
} from "@/features/degustation/tasting/mouth-options";
import {
  colorLabelKey,
  getHexForEyeColorId,
  isWineColorId,
} from "@/features/degustation/tasting/wine-colors";
import type { TastingSheet } from "@/types/database";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  sheet: TastingSheet;
  h: Dictionary["tastingHistory"];
  flow: Dictionary["tastingFlow"];
  locale: Locale;
};

function BarMeter({ value }: { value: number }) {
  const n = Number.isFinite(value) ? value : 5;
  const v = Math.min(10, Math.max(1, Math.round(n)));
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-sm sm:h-2.5 sm:w-2.5",
            i < v ? "bg-wine" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function aromaLabel(id: string, flow: Dictionary["tastingFlow"]): string {
  const map: Record<string, keyof Dictionary["tastingFlow"]> = {
    Fruity: "aromaFruity",
    Floral: "aromaFloral",
    Spicy: "aromaSpicy",
    Woody: "aromaWoody",
    Mineral: "aromaMineral",
    Vegetal: "aromaVegetal",
    Fermented: "aromaFermented",
  };
  const k = map[id];
  return k ? flow[k] : id;
}

export function TastingSheetDetail({ sheet, h, flow, locale }: Props) {
  const title = sheet.wine_name?.trim() || h.untitledWine;
  const hex = getHexForEyeColorId(sheet.eye_color);
  const when = formatTastingMonthYear(sheet.created_at, locale);
  const summary = buildAutoSummaryLine(sheet, h);
  const mood = computeTastingMood(sheet);

  const colorText =
    sheet.eye_color && isWineColorId(sheet.eye_color)
      ? flow[colorLabelKey(sheet.eye_color) as keyof Dictionary["tastingFlow"]]
      : sheet.eye_color ?? "—";

  const refletsText =
    sheet.eye_reflets && isWineColorId(sheet.eye_reflets)
      ? flow[colorLabelKey(sheet.eye_reflets) as keyof Dictionary["tastingFlow"]]
      : sheet.eye_reflets ?? "—";

  const wineTypeText =
    sheet.wine_type === "white"
      ? flow.wineTypeWhite
      : sheet.wine_type === "red"
        ? flow.wineTypeRed
        : sheet.wine_type === "rose"
          ? flow.wineTypeRose
          : "—";

  const robe = (() => {
    const v = parseLimpidity(sheet.eye_robe);
    if (v === "limpid") return flow.limpidClear;
    if (v === "slightly_cloudy") return flow.limpidSlight;
    if (v === "cloudy") return flow.limpidCloudy;
    return sheet.eye_robe ?? "—";
  })();

  const intensity = (() => {
    const v = parseIntensity(sheet.eye_intensity);
    if (v === "light") return flow.intensityPale;
    if (v === "medium") return flow.intensityMedium;
    if (v === "intense") return flow.intensityIntense;
    return sheet.eye_intensity ?? "—";
  })();

  const tears = (() => {
    const t = parseTears(sheet.eye_tears);
    const parts = [
      t.thickness === "fine"
        ? flow.tearsFine
        : t.thickness === "thick"
          ? flow.tearsThick
          : null,
      t.speed === "fast"
        ? flow.tearsFast
        : t.speed === "slow"
          ? flow.tearsSlow
          : null,
      t.colored === "colored"
        ? flow.tearsColored
        : t.colored === "uncolored"
          ? flow.tearsUncolored
          : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(" · ");
    const v = sheet.eye_tears;
    if (v === "none") return flow.tearsNone;
    if (v === "light") return flow.tearsLight;
    if (v === "pronounced") return flow.tearsPronounced;
    return v ?? "—";
  })();

  const noseInt = (() => {
    const v = sheet.nose_intensity;
    if (v === "light") return flow.noseIntLow;
    if (v === "medium") return flow.noseIntMid;
    if (v === "pronounced") return flow.noseIntHigh;
    return v ?? "—";
  })();

  const rawLen = sheet.mouth_length_caudalie;
  const len =
    rawLen != null && Number.isFinite(rawLen) ? Math.round(rawLen) : null;
  const lengthPhrase =
    len != null ? h.lengthOutOfTen.replace("{n}", String(len)) : "—";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 pb-12">
      <Link
        href="/degustation/history"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mt-4 -ml-2 w-fit gap-1 text-muted-foreground hover:text-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {h.backToList}
      </Link>

      <header className="space-y-3 border-b border-border/40 pb-6">
        <div className="flex items-start gap-4">
          <span
            className="mt-1 h-12 w-12 shrink-0 rounded-full border border-border/50 shadow-inner"
            style={{ backgroundColor: hex }}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="font-heading text-2xl font-semibold leading-tight text-wine sm:text-3xl">
              {title}
            </h1>
            {sheet.vintage != null ? (
              <p className="text-sm text-muted-foreground">{sheet.vintage}</p>
            ) : null}
            <p className="text-xs capitalize text-muted-foreground">{when}</p>
            <p className="inline-flex rounded-full border border-wine/15 bg-wine/5 px-2 py-0.5 text-[11px] font-medium text-wine">
              {mood === "fresh"
                ? h.moodFresh
                : mood === "powerful"
                  ? h.moodPowerful
                  : h.moodBalanced}
            </p>
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {h.sectionEye}
        </h2>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{h.labelWineType}</dt>
            <dd className="font-medium">{wineTypeText}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{h.labelColor}</dt>
            <dd className="font-medium">{colorText}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{h.labelReflets}</dt>
            <dd className="font-medium">{refletsText}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{flow.labelRobe}</dt>
            <dd className="font-medium">{robe}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{flow.labelIntensity}</dt>
            <dd className="font-medium">{intensity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{flow.labelTears}</dt>
            <dd className="font-medium">{tears}</dd>
          </div>
        </dl>
        {sheet.eye_notes ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {sheet.eye_notes}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border/30 pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {h.sectionNose}
        </h2>
        {sheet.nose_first_nose ? (
          <p className="text-sm leading-relaxed">{sheet.nose_first_nose}</p>
        ) : null}
        {sheet.nose_second_nose ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {sheet.nose_second_nose}
          </p>
        ) : null}
        {sheet.nose_aroma_families && sheet.nose_aroma_families.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sheet.nose_aroma_families.map((id) => (
              <span
                key={id}
                className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium"
              >
                {aromaLabel(id, flow)}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-sm">
          <span className="text-muted-foreground">
            {flow.labelNoseIntensity}:{" "}
          </span>
          <span className="font-medium">{noseInt}</span>
        </p>
        {sheet.nose_notes ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {sheet.nose_notes}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-border/30 pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {h.sectionMouth}
        </h2>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{flow.mouthAttack}</dt>
            <dd className="font-medium text-right">
              {(() => {
                const hit = MOUTH_ATTACK_OPTIONS.find(
                  (o) => o.id === sheet.mouth_attack,
                );
                if (hit) return flow[hit.labelKey];
                if (sheet.mouth_attack === "soft") return flow.attackSoft;
                if (sheet.mouth_attack === "medium") return flow.attackMedium;
                if (sheet.mouth_attack === "strong") return flow.attackStrong;
                return sheet.mouth_attack ?? "—";
              })()}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{h.labelFlavours}</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {sheet.mouth_flavours && sheet.mouth_flavours.length > 0
                ? sheet.mouth_flavours
                    .map((id) =>
                      catalogAromaLabel(id, locale === "en" ? "en" : "fr"),
                    )
                    .join(", ")
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{h.labelTexture}</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {sheet.mouth_texture && sheet.mouth_texture.length > 0
                ? sheet.mouth_texture
                    .map((id) => {
                      const hit = MOUTH_TEXTURE_OPTIONS.find((o) => o.id === id);
                      return hit ? flow[hit.labelKey] : id;
                    })
                    .join(", ")
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{flow.mouthFinish}</dt>
            <dd className="font-medium">
              {sheet.mouth_finish === "short"
                ? flow.finishShort
                : sheet.mouth_finish === "medium"
                  ? flow.finishMedium
                  : sheet.mouth_finish === "long"
                    ? flow.finishLong
                    : sheet.mouth_finish ?? "—"}
            </dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {h.balance}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{flow.sliderAcidity}</span>
              <BarMeter value={sheet.mouth_acidity ?? 5} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{flow.sliderTannins}</span>
              <BarMeter value={sheet.mouth_tannins ?? 5} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{flow.sliderAlcohol}</span>
              <BarMeter value={sheet.mouth_alcohol ?? 5} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{flow.sliderSugar}</span>
              <BarMeter value={sheet.mouth_sugar ?? 5} />
            </div>
          </div>
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">{h.lengthLabel}: </span>
          <span className="font-medium tabular-nums">{lengthPhrase}</span>
        </p>

        {sheet.mouth_notes ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {h.labelConclusion}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {sheet.mouth_notes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
