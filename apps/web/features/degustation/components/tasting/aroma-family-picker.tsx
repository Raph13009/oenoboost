"use client";

import { useState } from "react";

import {
  AROMA_FAMILIES,
  type AromaFamilyId,
} from "@/features/degustation/tasting/aroma-catalog";
import { cn } from "@/lib/utils";

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  locale?: "fr" | "en";
  lead?: string;
};

export function AromaFamilyPicker({
  selected,
  onChange,
  locale = "fr",
  lead,
}: Props) {
  const [open, setOpen] = useState<AromaFamilyId | null>(null);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      {lead ? <p className="text-[12px] text-[#80716b]">{lead}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {AROMA_FAMILIES.map((fam) => {
          const count = fam.subfamilies.reduce(
            (n, sub) =>
              n + sub.aromas.filter((a) => selected.includes(a.id)).length,
            0,
          );
          const isOpen = open === fam.id;
          return (
            <div key={fam.id} className="sm:col-span-1">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : fam.id)}
                className={cn(
                  "flex h-11 w-full items-center justify-between rounded-[6px] border px-3 text-left text-[13px] transition-colors",
                  isOpen || count > 0
                    ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
                    : "border-[#ddd6cc] bg-white text-[#65594f]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: fam.accent }}
                    aria-hidden
                  />
                  {locale === "en" ? fam.labelEn : fam.labelFr}
                </span>
                <span className="text-[11px] font-normal text-[#8a7c73]">
                  {count > 0 ? `${count} ✓` : isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div className="mt-2 space-y-3 rounded-[8px] border border-[#e7e0d7] bg-[#fbfaf7] p-3">
                  {fam.subfamilies.map((sub) => (
                    <div key={sub.id}>
                      {fam.subfamilies.length > 1 ? (
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#837361]">
                          {locale === "en" ? sub.labelEn : sub.labelFr}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {sub.aromas.map((aroma) => {
                          const on = selected.includes(aroma.id);
                          return (
                            <button
                              key={aroma.id}
                              type="button"
                              onClick={() => toggle(aroma.id)}
                              className={cn(
                                "inline-flex min-h-[36px] items-center rounded-[6px] border px-3 text-[12px]",
                                on
                                  ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
                                  : "border-[#ddd6cc] bg-white text-[#6c615c]",
                              )}
                            >
                              {on
                                ? `${locale === "en" ? aroma.labelEn : aroma.labelFr}  ✓`
                                : locale === "en"
                                  ? aroma.labelEn
                                  : aroma.labelFr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((id) => {
            const fam = AROMA_FAMILIES.flatMap((f) =>
              f.subfamilies.flatMap((s) =>
                s.aromas.filter((a) => a.id === id).map((a) => ({ a, f })),
              ),
            )[0];
            if (!fam) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="inline-flex h-8 items-center rounded-[4px] bg-[#e4d6d3] px-2.5 text-[11px] font-medium text-[#752e42]"
              >
                {locale === "en" ? fam.a.labelEn : fam.a.labelFr} ×
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
