import { readFile } from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

import { config as loadDotenv } from "dotenv";


type ConfigRule = {
  departements?: string[];
};

type RegionConfig = Record<string, ConfigRule>;

type GeoJsonFeature = {
  type: "Feature";
  properties?: {
    code?: string;
    nom?: string;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  };
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

const CHUNK_SIZE = 50;

function toMultiPolygon(geometry: GeoJsonFeature["geometry"]) {
  if (!geometry) {
    return geometry;
  }
  if (geometry.type === "MultiPolygon") {
    return geometry;
  }
  if (geometry.type === "Polygon") {
    return {
      type: "MultiPolygon",
      coordinates: [geometry.coordinates],
    };
  }
  throw new Error(`Unsupported geometry type for communes import: ${geometry.type}`);
}

function resolveRepoPath(inputPath: string) {
  return path.resolve(process.cwd(), inputPath);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  loadDotenv({ path: resolveRepoPath(".env") });

  const regionName = process.argv[2];
  const configPath = process.argv[3];
  const geojsonPath = process.argv[4] ?? "data/communes.geojson";

  if (!regionName || !configPath) {
    throw new Error(
      "Usage: npx tsx scripts/importCommunesByRegion.ts <region-name> <config-json> [communes-geojson]"
    );
  }

  const { getSupabaseAdmin } = await import("../lib/supabase");
  const supabase = getSupabaseAdmin();

  const configRaw = await readFile(resolveRepoPath(configPath), "utf8");
  const config = JSON.parse(configRaw) as RegionConfig;
  const deptCodes = Array.from(
    new Set(
      Object.values(config).flatMap((rule) => rule.departements ?? [])
    )
  ).sort();
  if (deptCodes.length === 0) {
    throw new Error(`No department codes found in ${configPath}`);
  }

  const geojsonRaw = await readFile(resolveRepoPath(geojsonPath), "utf8");
  const collection = JSON.parse(geojsonRaw) as GeoJsonFeatureCollection;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${geojsonPath}`);
  }

  const existingRes = await supabase.from("communes").select("name");
  if (existingRes.error) {
    throw new Error(`Failed to load existing communes: ${existingRes.error.message}`);
  }
  const existingNames = new Set(
    (existingRes.data ?? [])
      .map((row) => (typeof row.name === "string" ? row.name.trim() : ""))
      .filter(Boolean)
  );

  const deduped = new Map<string, { name: string; geometry: GeoJsonFeature["geometry"] }>();
  for (const feature of collection.features) {
    const code = feature.properties?.code?.trim();
    const name = feature.properties?.nom?.trim();
    const geometry = feature.geometry;
    if (!code || !name || !geometry) {
      continue;
    }
    if (!deptCodes.includes(code.slice(0, 2))) {
      continue;
    }
    if (deduped.has(name)) {
      continue;
    }
    if (existingNames.has(name)) {
      continue;
    }
    deduped.set(name, { name, geometry: toMultiPolygon(geometry) });
  }

  const rows = Array.from(deduped.values());
  console.log(`Region: ${regionName}`);
  console.log(`Departments: ${deptCodes.join(", ")}`);
  console.log(`Communes to insert: ${rows.length}`);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const insertRes = await supabase.from("communes").insert(chunk);
    if (insertRes.error) {
      throw new Error(
        `Failed on batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${insertRes.error.message}`
      );
    }
    inserted += chunk.length;
    console.log(`Inserted batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${inserted}/${rows.length}`);
    await sleep(250);
  }

  console.log(`Done. Inserted ${inserted} communes for ${regionName}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
