import { test, expect } from "@playwright/test";
import { loginCmsAsTestAdmin } from "../helpers/auth";
import { dismissNextDevOverlays, openFirstCmsTableRow } from "../helpers/cms-ui";
import { attachErrorProbe, assertNoHardCrashes } from "../helpers/errors";
import { cmsSecretConfigured, hasSupabaseEnv } from "../helpers/fixtures";

test.describe("CMS smoke @smoke", () => {
  // Serial: shared Next CMS server + overlay state is flaky under parallel clicks.
  test.describe.configure({ mode: "serial", timeout: 90_000 });

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
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await dismissNextDevOverlays(page);
    // Prefer product heading over body: Next dev overlay can mark <body> hidden.
    await expect(
      page.getByRole("heading", { name: /tableau de bord/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    assertNoHardCrashes(probe);
  });

  test("AOP editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/appellations", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^AOP$/i })).toBeVisible({
      timeout: 30_000,
    });
    const save = page.getByRole("button", { name: /enregistrer/i });
    await openFirstCmsTableRow(page, save);
    assertNoHardCrashes(probe);
  });

  test("grape editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/grapes", { waitUntil: "domcontentloaded" });
    const save = page.getByRole("button", { name: /enregistrer/i });
    await openFirstCmsTableRow(page, save);
    assertNoHardCrashes(probe);
  });

  test("vinification editor opens", async ({ page }) => {
    const probe = attachErrorProbe(page);
    await page.goto("/admin/vinification-types", {
      waitUntil: "domcontentloaded",
    });
    const save = page
      .getByRole("button", { name: /enregistrer|ajouter une étape/i })
      .first();
    await openFirstCmsTableRow(page, save);
    assertNoHardCrashes(probe);
  });
});
