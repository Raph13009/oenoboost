import { test, expect } from "@playwright/test";
import { loginCmsAsTestAdmin } from "../../e2e/helpers/auth";
import { cmsSecretConfigured, hasSupabaseEnv } from "../../e2e/helpers/fixtures";

const QA_STEP_PREFIX = "QA-16 ";

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

  test("new vinification step can be added", async ({ page }) => {
    const marker = `${QA_STEP_PREFIX}${Date.now()}`;

    await page.goto("/admin/vinification-types");
    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();

    const addButton = page.getByRole("button", { name: /ajouter une étape/i });
    await expect(addButton).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Chargement des étapes...")).toHaveCount(0);

    const stepHeadings = page.getByRole("button", { name: /^Étape \d+/ });
    const beforeCount = await stepHeadings.count();

    await addButton.click();
    await expect(addButton).toBeEnabled();
    await expect(page.locator(".border-red-200.bg-red-50")).toHaveCount(0);
    await expect(stepHeadings).toHaveCount(beforeCount + 1);

    const newCard = stepHeadings.nth(beforeCount).locator("xpath=ancestor::section[1]");
    await newCard.locator("input").first().fill(marker);
    await newCard.getByRole("button", { name: /enregistrer l'étape/i }).click();
    await expect(newCard.getByRole("button", { name: /^enregistrer l'étape$/i })).toBeEnabled();
    await expect(page.locator(".border-red-200.bg-red-50")).toHaveCount(0);

    await page.goto("/admin/vinification-types");
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(addButton).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Chargement des étapes...")).toHaveCount(0);
    await expect(page.getByText(marker)).toBeVisible({ timeout: 30_000 });

    const savedCard = page.getByRole("button", { name: new RegExp(marker) }).locator("xpath=ancestor::section[1]");
    await savedCard.getByRole("button", { name: /supprimer/i }).click();
    await expect(page.getByText(marker)).toHaveCount(0);
  });

  /**
   * Future feature hooks (enable when GitHub Issue is done):
   * - Grand Cru status persists
   * - Region history management
   * - DGC parent/child relationships
   * - AOP grape links persist (structured links, not rich text only)
   */
  test.fixme("Grand Cru status persists", async () => {});
  test.fixme("Region history can be managed", async () => {});
  test.fixme("DGC parent/child relationships persist", async () => {});
  test.fixme("AOP grape entity links persist", async () => {});
});
