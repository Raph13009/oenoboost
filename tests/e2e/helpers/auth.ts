import { createHmac } from "node:crypto";
import type { Page } from "@playwright/test";

function cmsSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-secret-change-in-prod"
  );
}

/** Mirrors apps/cms/lib/auth.ts test session cookie. */
export function buildCmsTestAdminCookie(): string {
  const sig = createHmac("sha256", cmsSecret())
    .update("test")
    .digest("base64url");
  return `test.${sig}`;
}

export async function loginCmsAsTestAdmin(page: Page): Promise<void> {
  const cmsUrl = process.env.QA_CMS_URL ?? "http://127.0.0.1:3001";
  const host = new URL(cmsUrl).hostname;
  await page.context().addCookies([
    {
      name: "ob_admin",
      value: buildCmsTestAdminCookie(),
      domain: host,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
}

export async function loginApp(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole("button", { name: /se connecter|log in|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
}
