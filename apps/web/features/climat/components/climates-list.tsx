import type { Locale } from "@/lib/i18n/config";
import type { ClimateType } from "../types";
import { ClimateCard } from "./climate-card";

type Props = {
  climates: ClimateType[];
  locale: Locale;
};

export function ClimatesList({ climates, locale }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto px-6 pb-2 no-scrollbar md:gap-4 md:px-0">
      {climates.map((climate) => (
        <ClimateCard key={climate.id} climate={climate} locale={locale} />
      ))}
    </div>
  );
}
