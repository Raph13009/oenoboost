import { test, expect } from "@playwright/test";
import { loginCmsAsTestAdmin } from "../helpers/auth";
import { attachErrorProbe, assertNoHardCrashes } from "../helpers/errors";
import { cmsSecretConfigured, hasSupabaseEnv } from "../helpers/fixtures";

test.describe("CMS smoke @smoke", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env");
    test.skip(
      !cmsSecretConfigured(),
      "Requires ADMIN_SESSION_SECRET or service role",
    );
    await loginCmsAsTestAdmin(page);
  });

  test("dashboard opens with test admin session", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator("body")).toBeVisible();
    assertNoHardCrashes(probe);
  });

  test("AOP editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/appellations");
    await expect(page.getByRole("heading", { name: /^AOP$/i })).toBeVisible();
    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(page.getByRole("button", { name: /enregistrer/i })).toBeVisible({
      timeout: 30_000,
    });
    assertNoHardCrashes(probe);
  });

  test("grape editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/grapes");
    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(page.getByRole("button", { name: /enregistrer/i })).toBeVisible({
      timeout: 30_000,
    });
    assertNoHardCrashes(probe);
  });

  test("vinification editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/vinification-types");
    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(
      page.getByRole("button", { name: /enregistrer|ajouter une étape/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    assertNoHardCrashes(probe);
  });
});
