import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Next.js 14/15 dev overlay ("1 error" toast / portal) steals pointer events
 * and can mark body hidden. Smoke should dismiss it before table interactions.
 */
export async function dismissNextDevOverlays(page: Page): Promise<void> {
  if (page.isClosed()) return;
  try {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
  } catch {
    return;
  }
  const toastClose = page
    .locator("[data-nextjs-toast] button, [data-next-badge] button")
    .first();
  if (await toastClose.isVisible().catch(() => false)) {
    await toastClose.click({ force: true }).catch(() => undefined);
  }
}

/**
 * Open the first CMS data row into the side editor, retrying until `ready`
 * (e.g. Enregistrer) is visible. Absorbs Next overlay / hydration click misses.
 */
export async function openFirstCmsTableRow(
  page: Page,
  ready: Locator,
): Promise<void> {
  // Real data rows have ≥2 cells; empty-state rows use a single colspan cell.
  const row = page
    .locator("table tbody tr")
    .filter({ has: page.locator("td").nth(1) })
    .first();
  await expect(row).toBeVisible({ timeout: 45_000 });

  for (let attempt = 0; attempt < 3; attempt++) {
    await dismissNextDevOverlays(page);
    await row.locator("td").nth(1).click({ force: true });
    try {
      await ready.waitFor({ state: "visible", timeout: 6_000 });
      return;
    } catch {
      // overlay / pending fetch — retry
    }
  }
  await expect(ready).toBeVisible({ timeout: 20_000 });
}
