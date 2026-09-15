"use client";

import { useEffect } from "react";

/**
 * Locks document body scroll when mounted (e.g. in CMS shell).
 * Unlocks on unmount so other pages (e.g. login) can scroll normally.
 */
export function LockBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);
  return null;
}
