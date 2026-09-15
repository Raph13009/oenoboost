const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { centroid } = require("@turf/turf");
const { createClient } = require("@supabase/supabase-js");

function resolveRepoPath(inputPath) {
  return path.resolve(process.cwd(), inputPath);
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  dotenv.config({ path: resolveRepoPath(".env") });

  const geojsonPath = process.argv[2];
  const region = process.argv[3];
  if (!geojsonPath || !region) {
    throw new Error(
      "Usage: node scripts/importSubregionsGeojson.js <geojson-path> <region-name>"
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials in .env");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
  });
  const raw = fs.readFileSync(resolveRepoPath(geojsonPath), "utf8");
  const collection = JSON.parse(raw);

  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${geojsonPath}`);
  }

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

  let inserted = 0;

  for (const feature of collection.features) {
    const name = String(feature?.properties?.name || "").trim();
    const geometry = feature?.geometry;
    if (feature?.type !== "Feature" || !name || !geometry) {
      throw new Error("Each feature must include properties.name and geometry");
    }

    const center = centroid(feature);
    const [centroidLng, centroidLat] = center.geometry.coordinates;

    const insertRes = await supabase.from("wine_subregions").insert({
      region_id: regionRes.data.id,
      slug: slugify(name),
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
    console.log(`Inserted ${name}`);
  }

  console.log(`Inserted ${inserted} subregions for ${region}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
