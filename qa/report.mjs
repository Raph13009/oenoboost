#!/usr/bin/env node
/**
 * Builds QA_REPORT.md from step results + Playwright JSON.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = path.join(root, "qa-artifacts");
const reportPath = path.join(root, "QA_REPORT.md");

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

const steps = readJson(path.join(artifacts, "steps.json"), {});
const pw = readJson(path.join(artifacts, "results.json"), null);
const db = readJson(path.join(artifacts, "db-check.json"), null);

function status(v) {
  if (v === true || v === "pass") return "PASS";
  if (v === false || v === "fail") return "FAIL";
  if (v === "skip") return "SKIP";
  return "—";
}

function countByProject(results, prefix) {
  if (!results?.suites) return { total: 0, failed: 0, skipped: 0 };
  let total = 0;
  let failed = 0;
  let skipped = 0;

  function walk(suite) {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        const project = t.projectName ?? "";
        if (prefix && !project.startsWith(prefix)) continue;
        total += 1;
        const result = t.results?.[t.results.length - 1];
        const s = result?.status ?? t.status;
        if (s === "skipped" || s === "interrupted") skipped += 1;
        else if (s !== "passed" && s !== "expected") failed += 1;
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  }
  for (const s of results.suites) walk(s);
  return { total, failed, skipped, passed: total - failed - skipped };
}

const app = countByProject(pw, "app");
const cms = countByProject(pw, "cms");
const all = countByProject(pw, "");

const failedNames = [];
function collectFails(suite) {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const result = t.results?.[t.results.length - 1];
      const s = result?.status ?? t.status;
      if (s && s !== "passed" && s !== "skipped" && s !== "expected") {
        failedNames.push(`${t.projectName ?? "?"} › ${spec.title}`);
      }
    }
  }
  for (const child of suite.suites ?? []) collectFails(child);
}
if (pw?.suites) for (const s of pw.suites) collectFails(s);

const overallFail =
  steps.build === false ||
  steps.typecheck === false ||
  steps.lint === false ||
  steps.unit === false ||
  steps.db === false ||
  steps.e2e === false ||
  (db && db.ok === false) ||
  (all.failed > 0);

const issue = process.env.QA_ISSUE || steps.issue || "—";
const cycles = process.env.QA_REPAIR_CYCLES ?? steps.repairCycles ?? "0";

const lines = [
  "# OenoBoost QA Report",
  "",
  `Issue: ${issue}`,
  `Generated: ${new Date().toISOString()}`,
  `Autonomous repair cycles used: ${cycles}`,
  "",
  `## Result: ${overallFail ? "NOT READY TO MERGE" : "READY TO MERGE"}`,
  "",
  "| Gate | Status |",
  "| --- | --- |",
  `| Build | ${status(steps.build)} |`,
  `| TypeScript | ${status(steps.typecheck)} |`,
  `| Lint | ${status(steps.lint)} |`,
  `| Unit | ${status(steps.unit)} |`,
  `| Database | ${status(steps.db ?? db?.ok)} |`,
  `| App E2E | ${app.total ? `${app.passed}/${app.total}` : status(steps.e2e)} |`,
  `| CMS E2E | ${cms.total ? `${cms.passed}/${cms.total}` : status(steps.e2e)} |`,
  `| All Playwright | ${all.total ? `${all.passed}/${all.total} (skip ${all.skipped})` : status(steps.e2e)} |`,
  "",
];

if (failedNames.length) {
  lines.push("## Failed scenarios", "");
  for (const name of failedNames) lines.push(`- ${name}`);
  lines.push("");
}

if (db?.failures?.length) {
  lines.push("## Database failures", "");
  for (const f of db.failures) lines.push(`- ${f}`);
  lines.push("");
}

lines.push(
  "## Artifacts",
  "",
  "- HTML report: `qa-artifacts/playwright-report/index.html`",
  "- Raw results: `qa-artifacts/results.json`",
  "- Screenshots / videos / traces: `qa-artifacts/test-results/`",
  "- DB check: `qa-artifacts/db-check.json`",
  "",
  "## Notes",
  "",
  "- Full QA should run only after human product approval.",
  "- Never weaken tests just to make CI green.",
  "",
);

fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`Wrote ${reportPath}`);
process.exit(overallFail ? 1 : 0);
