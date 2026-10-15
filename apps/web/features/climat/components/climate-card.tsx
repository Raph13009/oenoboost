import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getContent } from "@/lib/i18n/get-content";
import type { ClimateType } from "../types";

type ClimateCardProps = {
  climate: ClimateType;
  locale: Locale;
};

export function ClimateCard({ climate, locale }: ClimateCardProps) {
  const name = getContent(climate, "name", locale);
  const definition = getContent(climate, "definition", locale);

  return (
    <Link
      href={`/climat/${climate.slug}`}
      className="group block shrink-0"
      aria-label={name}
    >
      <article className="flex w-47 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_36px_-24px_rgba(0,0,0,0.45)] transition duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-wine/15 hover:shadow-[0_26px_44px_-22px_rgba(0,0,0,0.42)] md:w-60">
        <div
          className="relative aspect-[5/2] w-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${climate.color_hex ?? "#888"}cc, ${climate.color_hex ?? "#888"}55)`,
          }}
        />
        <div className="flex min-h-0 flex-col justify-between gap-2 p-3 md:gap-3 md:p-4">
          <h2 className="font-heading text-base font-semibold text-foreground md:text-lg">
            {name}
          </h2>
          {definition ? (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground md:text-sm">
              {definition}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
