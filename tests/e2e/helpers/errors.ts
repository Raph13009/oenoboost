import type { Page, ConsoleMessage, Request } from "@playwright/test";

export type PageErrorBag = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
};

export function attachErrorProbe(page: Page): PageErrorBag {
  const bag: PageErrorBag = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
  };

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Mapbox / hydration noise can appear without being a product failure.
      if (/Download the React DevTools|favicon|hydration/i.test(text)) return;
      bag.consoleErrors.push(text);
    }
  });

  page.on("pageerror", (err) => {
    bag.pageErrors.push(err.message);
  });

  page.on("requestfailed", (req: Request) => {
    const url = req.url();
    if (/mapbox|googleapis|analytics|hotjar/i.test(url)) return;
    bag.failedRequests.push(`${req.failure()?.errorText ?? "failed"} ${url}`);
  });

  return bag;
}

export function assertNoHardCrashes(bag: PageErrorBag): void {
  const hard = bag.pageErrors.filter((m) => {
    if (/ResizeObserver|Loading chunk/i.test(m)) return false;
    // Next.js RSC / error overlay internals (dev): not product regressions.
    if (/frame\.join is not a function/i.test(m)) return false;
    // Next 14 vs 15 wording variants for the same hydration mismatch noise.
    if (/Hydration failed because/i.test(m)) return false;
    if (/There was an error while hydrating/i.test(m)) return false;
    if (/Text content does not match server-rendered HTML/i.test(m)) return false;
    return true;
  });
  if (hard.length > 0) {
    throw new Error(`Page crashed:\n${hard.join("\n")}`);
  }
}
