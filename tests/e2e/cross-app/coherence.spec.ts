import { test, expect } from "@playwright/test";
import { loginCmsAsTestAdmin } from "../helpers/auth";
import {
  cmsSecretConfigured,
  hasSupabaseEnv,
  loadFixtures,
} from "../helpers/fixtures";

/**
 * Cross-app checks: CMS-visible published records must resolve in the public app.
 * Mutation round-trips are intentionally limited to avoid dirtying shared DBs.
 */
test.describe("Cross-app coherence", () => {
  test("published AOP visible in CMS resolves in app", async ({ browser }) => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env");
    test.skip(!cmsSecretConfigured(), "Requires CMS session secret");

    const fixtures = await loadFixtures();
    test.skip(!fixtures.aopSlug || !fixtures.regionSlug, "No AOP fixture");

    const cms = await browser.newPage({
      baseURL: process.env.QA_CMS_URL ?? "http://127.0.0.1:3001",
    });
    await loginCmsAsTestAdmin(cms);
    await cms.goto("/admin/appellations");
    const search = cms.getByPlaceholder(/rechercher des aop/i);
    await search.fill(fixtures.aopName ?? fixtures.aopSlug!);
    await expect(cms.locator("table tbody")).toContainText(
      fixtures.aopName ?? fixtures.aopSlug!,
      { timeout: 30_000 },
    );
    await cms.close();

    const app = await browser.newPage({
      baseURL: process.env.QA_WEB_URL ?? "http://127.0.0.1:3000",
    });
    await app.goto(
      `/vignoble/${fixtures.regionSlug}/${fixtures.aopSlug}?from=list`,
    );
    await expect(app.getByRole("heading", { level: 1 })).toContainText(
      fixtures.aopName ?? fixtures.aopSlug!,
    );
    await app.close();
  });

  test("soil → related AOP navigation stays coherent when links exist", async ({
    page,
  }) => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env");
    const fixtures = await loadFixtures();
    test.skip(!fixtures.soilSlug, "No soil fixture");
    await page.goto(`/sols/${fixtures.soilSlug}`);
    const related = page.getByRole("link").filter({ hasText: /AOP|aop/i });
    // Optional: soils may have zero related AOPs.
    if ((await related.count()) > 0) {
      await related.first().click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  /**
   * Future: DGC child routes to parent fiche once Issue #23 ships.
   */
  test.fixme("DGC child routes to parent fiche", async () => {});
});
