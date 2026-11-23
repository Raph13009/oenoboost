"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const START_PATH = "/degustation/vin/start";

type Props = {
  /** Kept for call-site compatibility; tasting can start as guest and auth happens at save. */
  isLoggedIn: boolean;
  ctaLabel: string;
  className?: string;
  authCopy?: unknown;
};

export function DegustationStartCta({ ctaLabel, className }: Props) {
  const epureCta =
    "inline-flex h-11 min-w-[min(100%,18rem)] items-center justify-between gap-6 rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white hover:opacity-95";

  return (
    <Link href={START_PATH} className={cn(epureCta, className)}>
      <span>{ctaLabel}</span>
      <span aria-hidden className="text-[20px] font-normal">
        →
      </span>
    </Link>
  );
}
