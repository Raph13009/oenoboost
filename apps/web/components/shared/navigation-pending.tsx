"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RouteLoadingSkeleton } from "@/components/shared/route-loading-skeleton";

const PENDING_TIMEOUT_MS = 12_000;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalAppHref(href: string, origin: string) {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return false;
    if (url.pathname.startsWith("/api/")) return false;
    return true;
  } catch {
    return false;
  }
}

function unlockBodyScroll() {
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overflow");
}

function NavigationPendingInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
    unlockBodyScroll();
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event) || event.button !== 0) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!isInternalAppHref(href, window.location.origin)) return;

      const next = new URL(href, window.location.origin);
      const current = new URL(window.location.href);
      if (
        next.pathname === current.pathname &&
        next.search === current.search
      ) {
        return;
      }

      setPending(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) {
      unlockBodyScroll();
      return;
    }

    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => {
      setPending(false);
      unlockBodyScroll();
    }, PENDING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
      unlockBodyScroll();
    };
  }, [pending]);

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex flex-col bg-background/95 px-6 pt-20 pb-8 backdrop-blur-[2px] lg:px-8"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <RouteLoadingSkeleton variant="hub" className="mx-auto w-full max-w-3xl" />
    </div>
  );
}

/** Soft-nav blocker: immediate skeleton so the previous page is not scrollable. */
export function NavigationPending() {
  return (
    <Suspense fallback={null}>
      <NavigationPendingInner />
    </Suspense>
  );
}
