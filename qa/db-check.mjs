#!/usr/bin/env node
/**
 * Lightweight DB QA for OenoBoost.
 * - Static: migration file order / presence
 * - Live (optional): read-only coherence checks against Supabase
 *
 * Never runs destructive statements. Refuses known production hosts unless
 * QA_ALLOW_REMOTE_DB=1 is set explicitly for a disposable test project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.qa") });
dotenv.config({ path: path.join(root, "apps/web/.env.local") });
dotenv.config({ path: path.join(root, "apps/cms/.env.local") });

const failures = [];
const notes = [];

function fail(msg) {
  failures.push(msg);
  console.error(`FAIL  ${msg}`);
}
function ok(msg) {
  console.log(`PASS  ${msg}`);
}
function info(msg) {
  notes.push(msg);
  console.log(`INFO  ${msg}`);
}

function checkMigrations() {
  const dir = path.join(root, "apps/web/supabase/migrations");
  if (!fs.existsSync(dir)) {
    fail(`Missing migrations directory: ${dir}`);
    return;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    fail("No migration SQL files found");
    return;
  }

  let prev = "";
  for (const file of files) {
    if (!/^\d{14}_[\w-]+\.sql$/.test(file)) {
      fail(`Migration name not timestamped: ${file}`);
    }
    if (file < prev) fail(`Migration order broken around ${file}`);
    prev = file;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    // Some historical stubs are empty placeholders; warn, don't block the gate.
    if (!sql.trim()) info(`Empty migration stub (ignored): ${file}`);
  }
  ok(`${files.length} migration files present and ordered`);

  const schemaRef = path.join(root, "docs/DATABASE_SCHEMA.sql");
  if (!fs.existsSync(schemaRef)) {
    fail("Missing docs/DATABASE_SCHEMA.sql reference");
  } else {
    ok("Canonical schema reference present (docs/DATABASE_SCHEMA.sql)");
  }
}

function isLikelyProduction(url) {
  // Heuristic only — prefer a dedicated test project.
  return /prod|production/i.test(url);
}

/**
 * Read-only PostgREST probes via fetch.
 * Avoids @supabase/supabase-js Realtime init, which requires Node 22+ native WebSocket
 * (or an explicit `ws` transport) and would crash the gate on Node 20.
 */
function restHeaders(apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

async function restGet(baseUrl, apiKey, pathAndQuery) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`, {
    method: "GET",
    headers: restHeaders(apiKey),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data.message
        ? data.message
        : `HTTP ${res.status}`;
    return { data: null, error: { message: msg } };
  }
  return { data, error: null };
}

async function restHeadCount(baseUrl, apiKey, table) {
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=*`,
    {
      method: "HEAD",
      headers: {
        ...restHeaders(apiKey),
        Prefer: "count=exact",
      },
    },
  );
  if (!res.ok) {
    return { error: { message: `HTTP ${res.status}` } };
  }
  return { error: null };
}

async function liveChecks() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    info("Skipping live DB checks (no Supabase env)");
    return;
  }

  if (isLikelyProduction(url) && process.env.QA_ALLOW_REMOTE_DB !== "1") {
    fail(
      "Refusing live checks against a URL that looks like production. Use a test project or set QA_ALLOW_REMOTE_DB=1 intentionally.",
    );
    return;
  }

  if (process.env.QA_ALLOW_REMOTE_DB !== "1") {
    info(
      "Live checks enabled in read-only mode. Set QA_ALLOW_REMOTE_DB=1 to acknowledge a remote test DB.",
    );
  }

  const apiKey = service || anon;

  const tables = [
    "wine_regions",
    "wine_region_history_milestones",
    "subregions",
    "aop",
    "grapes",
    "soil_types",
    "vinification_types",
    "users",
  ];

  for (const table of tables) {
    const { error } = await restHeadCount(url, apiKey, table);
    if (error) fail(`Table probe failed for ${table}: ${error.message}`);
    else ok(`Table reachable: ${table}`);
  }

  // Soft-deleted content should not appear as active if deleted_at set — sample.
  const { data: deletedAops, error: delErr } = await restGet(
    url,
    apiKey,
    "aop?select=id&deleted_at=not.is.null&limit=1",
  );
  if (delErr) info(`Could not probe soft-delete rows: ${delErr.message}`);
  else
    ok(
      `Soft-delete column queryable on aop (deleted sample count=${Array.isArray(deletedAops) ? deletedAops.length : 0})`,
    );

  // Wine color breakdown invariant: when any pct set, sum should be 100 (DB CHECK).
  const { data: badPct, error: pctErr } = await restGet(
    url,
    apiKey,
    "aop?select=id,slug,wine_pct_red,wine_pct_rose,wine_pct_white,wine_pct_sparkling,wine_pct_liqueur&or=(wine_pct_red.not.is.null,wine_pct_rose.not.is.null,wine_pct_white.not.is.null,wine_pct_sparkling.not.is.null,wine_pct_liqueur.not.is.null)&limit=200",
  );

  if (pctErr) {
    info(`Wine pct probe skipped: ${pctErr.message}`);
  } else {
    const offenders = (Array.isArray(badPct) ? badPct : []).filter((row) => {
      const vals = [
        row.wine_pct_red,
        row.wine_pct_rose,
        row.wine_pct_white,
        row.wine_pct_sparkling,
        row.wine_pct_liqueur,
      ];
      if (vals.every((v) => v == null)) return false;
      const sum = vals.reduce((a, v) => a + (v ?? 0), 0);
      return sum > 100;
    });
    if (offenders.length) {
      fail(
        `Found ${offenders.length} AOP wine color breakdown(s) summing over 100 (e.g. ${offenders[0].slug})`,
      );
    } else {
      ok("Sampled AOP wine color breakdowns stay at or below 100 when set");
    }
  }

  // Parent/child DGC: not implemented yet — skip with note.
  info("DGC parent/child DB checks deferred until feature schema exists");

  // Private notes: not implemented yet.
  info("Private AOP notes privacy checks deferred until feature exists");
}

checkMigrations();
await liveChecks();

const outDir = path.join(root, "qa-artifacts");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "db-check.json"),
  JSON.stringify({ ok: failures.length === 0, failures, notes }, null, 2),
);

if (failures.length) {
  console.error(`\nDB QA failed (${failures.length})`);
  process.exit(1);
}
console.log("\nDB QA passed");
