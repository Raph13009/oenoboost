import { test, expect } from "@playwright/test";
import { attachErrorProbe, assertNoHardCrashes } from "../helpers/errors";
import { hasSupabaseEnv, loadFixtures } from "../helpers/fixtures";

test.describe("App smoke @smoke", () => {
  test.beforeEach(() => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env (.env.qa)");
  });

  test("homepage loads", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: /vignoble/i }).first()).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("vineyard map loads", async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_MAPBOX_TOKEN, "Requires Mapbox token");
    const probe = attachErrorProbe(page);
    await page.goto("/vignoble");
    await expect(page.locator(".mapboxgl-canvas, canvas").first()).toBeVisible({
      timeout: 45_000,
    });
    assertNoHardCrashes(probe);
  });

  test("AOP browse list loads and filter control works", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/vignoble/aop");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const regionSelect = page.locator('select[name="region"]');
    await expect(regionSelect).toBeVisible();
    const options = regionSelect.locator("option");
    const count = await options.count();
    if (count > 1) {
      const value = await options.nth(1).getAttribute("value");
      if (value) {
        await regionSelect.selectOption(value);
        await expect(page).toHaveURL(/region=/);
      }
    }
    assertNoHardCrashes(probe);
  });

  test("AOP fiche opens safely", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.regionSlug || !fixtures.aopSlug, "No AOP fixture available");
    const probe = attachErrorProbe(page);
    await page.goto(
      `/vignoble/${fixtures.regionSlug}/${fixtures.aopSlug}?from=list`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      fixtures.aopName ?? fixtures.aopSlug!,
      { timeout: 30_000 },
    );
    assertNoHardCrashes(probe);
  });

  test("grape fiche opens", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.grapeSlug, "No grape fixture");
    const probe = attachErrorProbe(page);
    await page.goto(`/cepages/${fixtures.grapeSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("soil fiche opens", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.soilSlug, "No soil fixture");
    const probe = attachErrorProbe(page);
    await page.goto(`/sols/${fixtures.soilSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("vinification fiche opens", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.vinificationSlug, "No vinification fixture");
    const probe = attachErrorProbe(page);
    await page.goto(`/vinification/${fixtures.vinificationSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("vinification fiche opens from module carousel", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.vinificationSlug, "No vinification fixture");
    const probe = attachErrorProbe(page);
    await page.goto("/vinification");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const card = page.locator(`a[href="/vinification/${fixtures.vinificationSlug}"]`);
    await expect(card).toBeVisible();
    await card.click();

    await expect(page).toHaveURL(new RegExp(`/vinification/${fixtures.vinificationSlug}`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });
});
