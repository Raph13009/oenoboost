"use client";

import NextTopLoader from "nextjs-toploader";

/** Thin App Router navigation progress bar (wine brand). */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="#752e42"
      height={2.5}
      showSpinner={false}
      crawl
      crawlSpeed={180}
      speed={180}
      shadow="0 0 8px #752e42, 0 0 4px #752e42"
      zIndex={9999}
    />
  );
}
