const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const DEFAULT_COMMUNES_PATH = path.resolve(process.cwd(), "data/communes.geojson");
const DEFAULT_SIMPLIFY_TOLERANCE = 0.0008;
const BATCH_SIZE = 50;
const PRIORITY_BY_CONFIG_STEM = {
  sud_ouest_subregions_communes: [
    "Bergeracois",
    "Garonne Amont",
    "Tarn",
    "Béarn",
    "Pays Basque",
    "Quercy",
    "Rouergue (Aveyron)",
    "Piémont pyrénéen",
  ],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’]/g, "'")
    .trim()
    .toLowerCase();
}

function toPolygonFeature(feature) {
  if (!feature || !feature.geometry) return null;
  if (
    feature.geometry.type === "Polygon" ||
    feature.geometry.type === "MultiPolygon"
  ) {
    return feature;
  }
  return null;
}

function combineFeatures(features) {
  const combined = turf.combine(turf.featureCollection(features));
  return combined.features[0];
}

function unionPair(left, right) {
  try {
    const merged = turf.union(turf.featureCollection([left, right]));
    return merged || combineFeatures([left, right]);
  } catch {
    return combineFeatures([left, right]);
  }
}

function differencePair(left, right) {
  try {
    return turf.difference(turf.featureCollection([left, right]));
  } catch {
    return left;
  }
}

function unionChunk(features) {
  let merged = features[0];
  for (let index = 1; index < features.length; index += 1) {
    merged = unionPair(merged, features[index]);
  }
  return merged;
}

function unionInBatches(features, batchSize = BATCH_SIZE) {
  if (!features.length) {
    throw new Error("Cannot union an empty feature set.");
  }

  let current = features.slice();
  while (current.length > 1) {
    const next = [];
    for (let index = 0; index < current.length; index += batchSize) {
      next.push(unionChunk(current.slice(index, index + batchSize)));
    }
    current = next;
  }

  return current[0];
}

function simplifyFeature(feature, tolerance = DEFAULT_SIMPLIFY_TOLERANCE) {
  const simplified = turf.simplify(feature, {
    tolerance,
    highQuality: false,
    mutate: false,
  });
  return turf.cleanCoords(simplified);
}

function parseCommuneRef(value) {
  const raw = String(value);
  const separatorIndex = raw.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error(`Invalid commune ref "${raw}". Expected "DD:Commune".`);
  }

  return {
    dept: raw.slice(0, separatorIndex).trim(),
    name: raw.slice(separatorIndex + 1).trim(),
  };
}

function buildIndexes(communesCollection) {
  const byExact = new Map();
  const byNormalized = new Map();

  for (const feature of communesCollection.features) {
    const code = String(feature.properties?.code || "");
    const name = String(feature.properties?.nom || "");
    const dept = code.slice(0, 2);
    if (!dept || !name) continue;

    const polygonFeature = toPolygonFeature(feature);
    if (!polygonFeature) continue;

    byExact.set(`${dept}:${name}`, polygonFeature);
    byNormalized.set(`${dept}:${normalizeText(name)}`, polygonFeature);
  }

  return { byExact, byNormalized };
}

function resolveFeature(ref, indexes) {
  const exactKey = `${ref.dept}:${ref.name}`;
  const exact = indexes.byExact.get(exactKey);
  if (exact) return exact;

  const normalized = indexes.byNormalized.get(
    `${ref.dept}:${normalizeText(ref.name)}`
  );
  if (normalized) return normalized;

  return null;
}

function buildPriorityOrder(configPath, subregionNames) {
  const stem = path.basename(configPath, path.extname(configPath));
  const preferred = PRIORITY_BY_CONFIG_STEM[stem] || [];
  const preferredSet = new Set(preferred);
  return [
    ...preferred.filter((name) => subregionNames.includes(name)),
    ...subregionNames.filter((name) => !preferredSet.has(name)),
  ];
}

function buildPriorityRanks(priorityOrder) {
  const ranks = new Map();
  priorityOrder.forEach((name, index) => ranks.set(name, index));
  return ranks;
}

function assignExclusiveCommuneRefs(config, priorityOrder) {
  const ranks = buildPriorityRanks(priorityOrder);
  const ownersByCommune = new Map();

  for (const [subregionName, communeRefs] of Object.entries(config)) {
    for (const rawRef of communeRefs) {
      const existingOwner = ownersByCommune.get(rawRef);
      if (!existingOwner) {
        ownersByCommune.set(rawRef, subregionName);
        continue;
      }

      const existingRank = ranks.get(existingOwner) ?? Number.MAX_SAFE_INTEGER;
      const nextRank = ranks.get(subregionName) ?? Number.MAX_SAFE_INTEGER;
      if (nextRank < existingRank) {
        ownersByCommune.set(rawRef, subregionName);
      }
    }
  }

  const exclusive = {};
  const overlapLog = [];

  for (const [subregionName, communeRefs] of Object.entries(config)) {
    exclusive[subregionName] = communeRefs.filter((rawRef) => {
      const owner = ownersByCommune.get(rawRef);
      const keep = owner === subregionName;
      if (!keep) {
        overlapLog.push(`${rawRef} kept by ${owner}, removed from ${subregionName}`);
      }
      return keep;
    });
  }

  return { exclusive, overlapLog };
}

function ensureFeature(feature, label) {
  const polygonFeature = toPolygonFeature(feature);
  if (!polygonFeature) {
    throw new Error(`Invalid polygon result for ${label}`);
  }
  return polygonFeature;
}

function main() {
  const configArg = process.argv[2];
  const outputArg = process.argv[3];
  const communesArg = process.argv[4];

  if (!configArg || !outputArg) {
    throw new Error(
      "Usage: node scripts/generateSubregionsGeojson.js <config-json> <output-geojson> [communes-geojson]"
    );
  }

  const configPath = path.resolve(process.cwd(), configArg);
  const outputPath = path.resolve(process.cwd(), outputArg);
  const communesPath = communesArg
    ? path.resolve(process.cwd(), communesArg)
    : DEFAULT_COMMUNES_PATH;

  const config = readJson(configPath);
  const communes = readJson(communesPath);
  const indexes = buildIndexes(communes);
  const subregionNames = Object.keys(config);
  const priorityOrder = buildPriorityOrder(configPath, subregionNames);
  const { exclusive, overlapLog } = assignExclusiveCommuneRefs(config, priorityOrder);
  const rawFeatures = new Map();

  console.log(`Priority order: ${priorityOrder.join(" > ")}`);
  if (overlapLog.length) {
    console.log(`Resolved ${overlapLog.length} duplicate commune assignments`);
  }

  for (const subregionName of subregionNames) {
    const communeRefs = exclusive[subregionName];
    if (!Array.isArray(communeRefs) || !communeRefs.length) {
      console.log(
        `Skipped ${subregionName}: no communes remain after priority resolution`
      );
      continue;
    }

    const resolved = [];
    const missing = [];

    for (const rawRef of communeRefs) {
      const ref = parseCommuneRef(rawRef);
      const feature = resolveFeature(ref, indexes);
      if (!feature) {
        missing.push(`${ref.dept}:${ref.name}`);
        continue;
      }
      resolved.push(feature);
    }

    if (missing.length) {
      throw new Error(
        `Missing communes for "${subregionName}": ${missing.join(", ")}`
      );
    }

    const merged = ensureFeature(unionInBatches(resolved), subregionName);
    rawFeatures.set(subregionName, merged);

    console.log(
      `Generated ${subregionName}: ${resolved.length} communes merged`
    );
  }

  const features = [];
  let claimedGeometry = null;

  for (const subregionName of priorityOrder) {
    let current = rawFeatures.get(subregionName);
    if (!current) continue;

    if (claimedGeometry) {
      const withoutOverlap = differencePair(current, claimedGeometry);
      if (!withoutOverlap || !withoutOverlap.geometry) {
        console.log(`Skipped ${subregionName}: fully absorbed by higher priority regions`);
        continue;
      }
      current = ensureFeature(withoutOverlap, `${subregionName} exclusive geometry`);
    }

    const simplified = simplifyFeature(current);

    features.push({
      type: "Feature",
      properties: {
        name: subregionName,
      },
      geometry: simplified.geometry,
    });

    claimedGeometry = claimedGeometry
      ? ensureFeature(unionPair(claimedGeometry, simplified), "claimed geometry")
      : simplified;
  }

  const collection = {
    type: "FeatureCollection",
    features,
  };

  fs.writeFileSync(outputPath, JSON.stringify(collection));
  console.log(`Created ${outputPath}`);
}

main();
