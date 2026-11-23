"use client";

import { cn } from "@/lib/utils";

export function EpureOptionBtn({
  active,
  label,
  onClick,
  className,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[42px] items-center rounded-[6px] border px-[18px] text-left text-[12px] transition-colors",
        active
          ? "border-[#752e42] bg-[#f5ecec] font-semibold text-[#752e42]"
          : "border-[#ddd6cc] bg-white font-normal text-[#6c615c]",
        className,
      )}
    >
      {active ? `${label}  ✓` : label}
    </button>
  );
}
