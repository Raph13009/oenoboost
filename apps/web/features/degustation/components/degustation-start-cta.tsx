"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  FavoritesAuthModal,
  type FavoritesAuthModalCopy,
} from "@/components/shared/favorites-auth-modal";
import { cn } from "@/lib/utils";

const START_PATH = "/degustation/vin/start";

type Props = {
  isLoggedIn: boolean;
  ctaLabel: string;
  className?: string;
  authCopy: FavoritesAuthModalCopy;
};

export function DegustationStartCta({
  isLoggedIn,
  ctaLabel,
  className,
  authCopy,
}: Props) {
  const [authOpen, setAuthOpen] = useState(false);

  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(START_PATH)}`,
    [],
  );
  const registerHref = useMemo(
    () => `/signup?next=${encodeURIComponent(START_PATH)}`,
    [],
  );

  const epureCta =
    "inline-flex h-11 min-w-[min(100%,18rem)] items-center justify-between gap-6 rounded-[6px] bg-[#752e42] px-[22px] text-[13px] font-medium text-white hover:opacity-95";

  if (isLoggedIn) {
    return (
      <Link href={START_PATH} className={cn(epureCta, className)}>
        <span>{ctaLabel}</span>
        <span aria-hidden className="text-[20px] font-normal">
          →
        </span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className={cn(epureCta, className)}
      >
        <span>{ctaLabel}</span>
        <span aria-hidden className="text-[20px] font-normal">
          →
        </span>
      </button>
      <FavoritesAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        copy={authCopy}
        loginHref={loginHref}
        registerHref={registerHref}
      />
    </>
  );
}
