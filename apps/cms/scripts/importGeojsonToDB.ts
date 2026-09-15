import { readFile } from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

import { centroid } from "@turf/turf";
import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";


type GeoJsonFeature = {
  type: "Feature";
  properties?: {
    region?: string;
    name?: string;
    slug?: string;
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

const REGION_NAME_BY_KEY: Record<string, string> = {
  loire: "Vallée de la Loire",
  bordeaux: "Bordeaux",
  bourgogne: "Bourgogne",
  alsace: "Alsace",
  champagne: "Champagne",
  provence: "Provence",
  savoie: "Savoie",
  corse: "Corse",
  beaujolais: "Beaujolais",
  jura: "Jura",
  "sud-ouest": "Sud-Ouest",
  sud_ouest: "Sud-Ouest",
  languedoc_roussillon: "Languedoc-Roussillon",
  "languedoc-roussillon": "Languedoc-Roussillon",
  vallee_du_rhone: "Vallée du Rhône",
  "vallee-du-rhone": "Vallée du Rhône",
};

function resolveRepoPath(inputPath: string) {
  return path.resolve(process.cwd(), inputPath);
}

function getRegionName(regionKey: string) {
  const normalized = regionKey.trim().toLowerCase();
  const regionName = REGION_NAME_BY_KEY[normalized];
  if (!regionName) {
    throw new Error(`Unsupported region key: ${regionKey}`);
  }
  return regionName;
}

async function main() {
  loadDotenv({ path: resolveRepoPath(".env") });

  const geojsonPath = process.argv[2];
  if (!geojsonPath) {
    throw new Error("Usage: npx tsx scripts/importGeojsonToDB.ts <geojson-path>");
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials in .env");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const raw = await readFile(resolveRepoPath(geojsonPath), "utf8");
  const collection = JSON.parse(raw) as GeoJsonFeatureCollection;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${geojsonPath}`);
  }

  let inserted = 0;
  let skipped = 0;

  for (const feature of collection.features) {
    if (feature.type !== "Feature" || !feature.geometry) {
      throw new Error("Invalid feature: missing geometry");
    }

    const regionKey = feature.properties?.region;
    const name = feature.properties?.name;
    const slug = feature.properties?.slug;
    if (!regionKey || !name || !slug) {
      throw new Error("Invalid feature: properties.region, properties.name and properties.slug are required");
    }

    const regionName = getRegionName(regionKey);
    const regionRes = await supabase
      .from("wine_regions")
      .select("id")
      .eq("name_fr", regionName)
      .limit(1)
      .maybeSingle();

    if (regionRes.error) {
      throw new Error(`Failed to load wine region ${regionName}: ${regionRes.error.message}`);
    }
    if (!regionRes.data?.id) {
      throw new Error(`Region not found in wine_regions: ${regionName}`);
    }

    const existingRes = await supabase
      .from("wine_subregions")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (existingRes.error) {
      throw new Error(`Failed to check existing slug ${slug}: ${existingRes.error.message}`);
    }
    if (existingRes.data?.id) {
      skipped += 1;
      console.log(`Skipping slug: ${slug}`);
      continue;
    }

    const centroidFeature = centroid(feature as never);
    const [centroidLng, centroidLat] = centroidFeature.geometry.coordinates;

    const insertRes = await supabase.from("wine_subregions").insert({
      region_id: regionRes.data.id,
      slug,
      name_fr: name,
      name_en: name,
      geojson: feature.geometry,
      centroid_lat: centroidLat,
      centroid_lng: centroidLng,
    });

    if (insertRes.error) {
      throw new Error(`Failed to insert ${slug}: ${insertRes.error.message}`);
    }

    inserted += 1;
    console.log(`Inserted: ${name} (${slug})`);
  }

  console.log(`Done. Inserted: ${inserted}. Skipped: ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
