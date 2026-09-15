import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env.qa") });
dotenv.config({ path: path.resolve(__dirname, "apps/web/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "apps/cms/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "apps/web/.env") });
dotenv.config({ path: path.resolve(__dirname, "apps/cms/.env") });

const WEB_PORT = Number(process.env.QA_WEB_PORT ?? 3000);
const CMS_PORT = Number(process.env.QA_CMS_PORT ?? 3001);
const WEB_URL = process.env.QA_WEB_URL ?? `http://127.0.0.1:${WEB_PORT}`;
const CMS_URL = process.env.QA_CMS_URL ?? `http://127.0.0.1:${CMS_PORT}`;
const reuseExisting = process.env.QA_REUSE_SERVERS === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "qa-artifacts/playwright-report" }],
    ["json", { outputFile: "qa-artifacts/results.json" }],
  ],
  outputDir: "qa-artifacts/test-results",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "app-desktop",
      testMatch: [
        "**/e2e/app/**/*.spec.ts",
        "**/regression/app/**/*.spec.ts",
        "**/e2e/cross-app/**/*.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_URL,
      },
    },
    {
      name: "app-mobile",
      testMatch: [
        "**/e2e/app/**/*.spec.ts",
        "**/regression/app/**/*.spec.ts",
      ],
      use: {
        ...devices["iPhone 13"],
        baseURL: WEB_URL,
      },
    },
    {
      name: "cms-desktop",
      testMatch: [
        "**/e2e/cms/**/*.spec.ts",
        "**/regression/cms/**/*.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: CMS_URL,
      },
    },
  ],
  webServer: reuseExisting
    ? undefined
    : [
        {
          command: `npm --workspace apps/web run dev -- -p ${WEB_PORT}`,
          url: WEB_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: `npm --workspace apps/cms run dev -- -p ${CMS_PORT}`,
          url: `${CMS_URL}/admin`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
});
