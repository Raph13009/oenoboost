import { test, expect } from "@playwright/test";
import { attachErrorProbe, assertNoHardCrashes } from "../helpers/errors";

const LEGAL_ROUTES = [
  { path: "/mentions-legales", heading: /mentions légales|legal notice/i },
  { path: "/cgv", heading: /conditions générales|terms of sale/i },
  {
    path: "/confidentialite",
    heading: /politique de confidentialité|privacy policy/i,
  },
] as const;

test.describe("Legal pages @smoke", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const route of LEGAL_ROUTES) {
    test(`${route.path} is readable logged out`, async ({ page }) => {
      const probe = attachErrorProbe(page);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        route.heading,
        { timeout: 30_000 },
      );
      await expect(page.getByText(/Hortense Chevalier/i).first()).toBeVisible();
      assertNoHardCrashes(probe);
    });
  }

  test("homepage footer links to legal pages", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator('footer a[href="/mentions-legales"]').first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('footer a[href="/cgv"]').first()).toBeVisible();
    await expect(
      page.locator('footer a[href="/confidentialite"]').first(),
    ).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("signup shows legal notice links", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator('a[href="/mentions-legales"]').first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.locator('a[href="/confidentialite"]').first(),
    ).toBeVisible();
    assertNoHardCrashes(probe);
  });
});
