"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

type RegionOption = {
  id: string;
  name_fr: string;
  name_en: string;
};

type AopFiltersProps = {
  locale: "fr" | "en";
  regionLabel: string;
  selectedRegionId?: string;
  regions: RegionOption[];
};

export function AopFilters({
  locale,
  regionLabel,
  selectedRegionId = "",
  regions,
}: AopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [regionId, setRegionId] = useState(selectedRegionId);

  const onRegionChange = (value: string) => {
    setRegionId(value);
    const params = new URLSearchParams();
    if (value) params.set("region", value);
    startTransition(() => {
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    });
  };

  return (
    <div
      className={`transition-opacity ${isPending ? "opacity-70" : "opacity-100"}`}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => onRegionChange("")}
          data-active={!regionId}
          className="vs-chip shrink-0"
        >
          {regionLabel}
        </button>
        {regions.map((region) => {
          const label = locale === "fr" ? region.name_fr : region.name_en;
          const active = regionId === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onRegionChange(region.id)}
              data-active={active}
              className="vs-chip shrink-0"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
