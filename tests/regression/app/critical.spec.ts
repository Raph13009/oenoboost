import { test, expect } from "@playwright/test";
import { attachErrorProbe, assertNoHardCrashes } from "../../e2e/helpers/errors";
import {
  freeAuthConfigured,
  hasSupabaseEnv,
  loadFixtures,
  premiumAuthConfigured,
} from "../../e2e/helpers/fixtures";
import { loginApp } from "../../e2e/helpers/auth";

test.describe("App critical regression", () => {
  test.beforeEach(() => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env (.env.qa)");
  });

  test("region page opens from slug", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.regionSlug, "No region fixture");
    const probe = attachErrorProbe(page);
    await page.goto(`/vignoble/${fixtures.regionSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("subregion page opens when available", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(
      !fixtures.regionSlug || !fixtures.subregionSlug,
      "No subregion fixture",
    );
    const probe = attachErrorProbe(page);
    await page.goto(`/vignoble/${fixtures.regionSlug}/${fixtures.subregionSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("map deep-link opens region context", async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_MAPBOX_TOKEN, "Requires Mapbox token");
    const fixtures = await loadFixtures();
    test.skip(!fixtures.regionSlug, "No region fixture");
    const probe = attachErrorProbe(page);
    await page.goto(`/vignoble?region=${fixtures.regionSlug}`);
    await expect(page.locator(".mapboxgl-canvas, canvas").first()).toBeVisible({
      timeout: 45_000,
    });
    // Action bar appears once region exploration mode is active.
    await expect(
      page.getByRole("button", { name: /régions|regions|retour/i }).first(),
    ).toBeVisible({ timeout: 45_000 });
    assertNoHardCrashes(probe);
  });

  test("AOP fiche key sections render without crash", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.regionSlug || !fixtures.aopSlug, "No AOP fixture");
    const probe = attachErrorProbe(page);
    await page.goto(
      `/vignoble/${fixtures.regionSlug}/${fixtures.aopSlug}?from=list`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Sections may be gated/empty; page must still be stable.
    await expect(page.locator("main, body")).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("cepages list entry points work", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/cepages");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: /blancs|white/i }).first().click();
    await expect(page).toHaveURL(/type=white/);
    assertNoHardCrashes(probe);
  });

  test("quiz daily requires auth", async ({ page }) => {
    await page.goto("/quiz/daily");
    await expect(page).toHaveURL(/login/);
  });

  test("free vs premium gate appears for premium content when logged out", async ({
    page,
  }) => {
    const fixtures = await loadFixtures();
    test.skip(
      !fixtures.regionSlug || !fixtures.premiumAopSlug,
      "No premium AOP fixture",
    );
    await page.goto(
      `/vignoble/${fixtures.regionSlug}/${fixtures.premiumAopSlug}?from=list`,
    );
    await expect(
      page.getByText(/contenu premium|passer à premium|premium/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("favorites auth gate for anonymous users", async ({ page }) => {
    const fixtures = await loadFixtures();
    test.skip(!fixtures.grapeSlug, "No grape fixture");
    await page.goto(`/cepages/${fixtures.grapeSlug}`);
    const fav = page.getByRole("button", {
      name: /ajouter aux favoris|add to favorites/i,
    });
    if (await fav.count()) {
      await fav.first().click();
      await expect(
        page.getByText(/fonctionnalité réservée|créer un compte|se connecter/i).first(),
      ).toBeVisible();
    }
  });

  test("free user can sign in when credentials configured", async ({ page }) => {
    test.skip(!freeAuthConfigured(), "QA_FREE_EMAIL/PASSWORD not set");
    await loginApp(
      page,
      process.env.QA_FREE_EMAIL!,
      process.env.QA_FREE_PASSWORD!,
    );
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("premium user can sign in when credentials configured", async ({
    page,
  }) => {
    test.skip(!premiumAuthConfigured(), "QA_PREMIUM_EMAIL/PASSWORD not set");
    await loginApp(
      page,
      process.env.QA_PREMIUM_EMAIL!,
      process.env.QA_PREMIUM_PASSWORD!,
    );
    await page.goto("/profil");
    await expect(page.locator("body")).toBeVisible();
  });
});

/**
 * Future: private AOP notes — enable when feature ships.
 * test.fix('private AOP notes persist for authenticated user', ...)
 */
