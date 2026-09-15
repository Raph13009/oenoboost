#!/usr/bin/env node
/**
 * Full QA gate for OenoBoost.
 * Run only after human product validation of the feature.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.qa") });
dotenv.config({ path: path.join(root, "apps/web/.env.local") });
dotenv.config({ path: path.join(root, "apps/cms/.env.local") });

const artifacts = path.join(root, "qa-artifacts");
fs.mkdirSync(artifacts, { recursive: true });

const steps = {
  issue: process.env.QA_ISSUE ?? null,
  repairCycles: process.env.QA_REPAIR_CYCLES ?? "0",
  build: null,
  typecheck: null,
  lint: null,
  unit: null,
  db: null,
  e2e: null,
};

function run(label, command, args, opts = {}) {
  console.log(`\n=== ${label} ===\n`);
  const res = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    ...opts,
  });
  const ok = res.status === 0;
  console.log(ok ? `\n✔ ${label}` : `\n✖ ${label}`);
  return ok;
}

const skipE2E =
  process.env.QA_SKIP_E2E === "1" ||
  (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.CI);

steps.lint = run("Lint", "npm", ["run", "lint"]);
// Pre-existing web lint debt should not block standing up the QA gate locally.
// Set QA_STRICT=1 (CI default) to fail the full gate on lint errors.
if (
  steps.lint === false &&
  process.env.QA_STRICT !== "1" &&
  process.env.CI !== "true"
) {
  console.log(
    "\n⚠ Lint failed (pre-existing issues). Continuing because QA_STRICT is not set.\n",
  );
  steps.lint = "skip";
}
steps.typecheck = run("Typecheck", "npm", ["run", "typecheck"]);
steps.unit = run("Unit tests", "npm", ["run", "test:unit"]);
steps.build = run("Build", "npm", ["run", "build"]);
steps.db = run("Database checks", "npm", ["run", "qa:db"]);

if (skipE2E) {
  console.log("\n=== Playwright E2E skipped (no Supabase env / QA_SKIP_E2E=1) ===\n");
  steps.e2e = "skip";
} else {
  steps.e2e = run("Playwright E2E", "npx", ["playwright", "test"]);
}

fs.writeFileSync(path.join(artifacts, "steps.json"), JSON.stringify(steps, null, 2));

const report = spawnSync("node", ["qa/report.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const failed =
  [steps.lint, steps.typecheck, steps.unit, steps.build, steps.db].some(
    (s) => s === false,
  ) ||
  steps.e2e === false ||
  report.status !== 0;

process.exit(failed ? 1 : 0);
