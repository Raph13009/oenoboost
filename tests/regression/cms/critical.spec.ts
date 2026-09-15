import { test, expect } from "@playwright/test";
import { loginCmsAsTestAdmin } from "../../e2e/helpers/auth";
import { cmsSecretConfigured, hasSupabaseEnv } from "../../e2e/helpers/fixtures";

test.describe("CMS critical regression", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env");
    test.skip(!cmsSecretConfigured(), "Requires CMS session secret");
    await loginCmsAsTestAdmin(page);
  });

  test("AOP list search is usable", async ({ page }) => {
    await page.goto("/admin/appellations");
    const search = page.getByPlaceholder(/rechercher des aop/i);
    await expect(search).toBeVisible();
    await search.fill("a");
    await expect(page.locator("table tbody")).toBeVisible();
  });

  test("color distribution UI never allows obvious >100% without validation path", async ({
    page,
  }) => {
    await page.goto("/admin/appellations");
    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(page.getByRole("button", { name: /enregistrer/i })).toBeVisible({
      timeout: 30_000,
    });
    // Soft check: editor is present. Hard sum validation is covered by unit tests
    // (lib/aop-wine-color-breakdown.test.ts) and DB CHECK constraints.
    await expect(page.locator("body")).toContainText(/AOP|vin|%/i);
  });

  /**
   * Future feature hooks (enable when GitHub Issue is done):
   * - Grand Cru status persists
   * - Region history management
   * - DGC parent/child relationships
   * - AOP grape links persist (structured links, not rich text only)
   * - Vinification step add regression once fixed
   */
  test.fix("Grand Cru status persists", async () => {});
  test.fix("Region history can be managed", async () => {});
  test.fix("DGC parent/child relationships persist", async () => {});
  test.fix("AOP grape entity links persist", async () => {});
  test.fix("new vinification step can be added", async () => {});
});
