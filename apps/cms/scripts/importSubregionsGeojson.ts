import { readFile } from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

import { centroid } from "@turf/turf";
import { config as loadDotenv } from "dotenv";


type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  properties?: {
    name?: string;
  };
  geometry?: GeoJsonGeometry;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

function resolveRepoPath(inputPath: string) {
  return path.resolve(process.cwd(), inputPath);
}

async function main() {
  loadDotenv({ path: resolveRepoPath(".env") });

  const geojsonPath = process.argv[2];
  const region = process.argv[3] ?? "Bourgogne";
  if (!geojsonPath) {
    throw new Error(
      "Usage: npx tsx scripts/importSubregionsGeojson.ts <geojson-path> [region-name]"
    );
  }

  const raw = await readFile(resolveRepoPath(geojsonPath), "utf8");
  const collection = JSON.parse(raw) as GeoJsonFeatureCollection;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${geojsonPath}`);
  }

  const { getSupabaseAdmin } = await import("../lib/supabase");
  const supabase = getSupabaseAdmin();

  const regionRes = await supabase
    .from("wine_regions")
    .select("id")
    .eq("name_fr", region)
    .limit(1)
    .maybeSingle();
  if (regionRes.error) {
    throw new Error(`Failed to load region ${region}: ${regionRes.error.message}`);
  }
  if (!regionRes.data?.id) {
    throw new Error(`Region not found in wine_regions: ${region}`);
  }

  const deleteRes = await supabase
    .from("wine_subregions")
    .delete()
    .eq("region_id", regionRes.data.id);
  if (deleteRes.error) {
    throw new Error(
      `Failed to delete existing subregions for ${region}: ${deleteRes.error.message}`
    );
  }

  const seenNames = new Set<string>();
  let inserted = 0;

  for (const feature of collection.features) {
    const name = feature.properties?.name?.trim();
    const geometry = feature.geometry;

    if (feature.type !== "Feature" || !name || !geometry) {
      throw new Error("Each feature must include properties.name and geometry");
    }

    if (seenNames.has(name)) {
      console.log(`Skipping duplicate in file: ${name}`);
      continue;
    }
    seenNames.add(name);

    const center = centroid(feature as never);
    const [centroidLng, centroidLat] = center.geometry.coordinates;
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");

    const insertRes = await supabase.from("wine_subregions").insert({
      region_id: regionRes.data.id,
      slug,
      name_fr: name,
      name_en: name,
      geojson: geometry,
      centroid_lat: centroidLat,
      centroid_lng: centroidLng,
    });

    if (insertRes.error) {
      throw new Error(`Failed to insert ${name}: ${insertRes.error.message}`);
    }

    inserted += 1;
    console.log(`Inserted: ${name}`);
  }

  console.log(`Inserted ${inserted} subregions for ${region}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
