/* eslint-disable @typescript-eslint/no-explicit-any */

export type Bounds = [[number, number], [number, number]];

export function computeMultiPolygonBounds(
  geometry: GeoJSON.MultiPolygon,
): Bounds | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      for (const coord of ring) {
        const lng = coord[0];
        const lat = coord[1];
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Union of several bounds; skips nulls. Returns null if none valid. */
export function unionBounds(boundsList: Array<Bounds | null | undefined>): Bounds | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let found = false;

  for (const b of boundsList) {
    if (!b) continue;
    found = true;
    if (b[0][0] < minLng) minLng = b[0][0];
    if (b[0][1] < minLat) minLat = b[0][1];
    if (b[1][0] > maxLng) maxLng = b[1][0];
    if (b[1][1] > maxLat) maxLat = b[1][1];
  }

  if (!found) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function normalizeToMultiPolygon(
  geojson: any,
): GeoJSON.MultiPolygon | null {
  if (!geojson) return null;
  const g = geojson.type === "Feature" ? geojson.geometry : geojson;
  if (!g || typeof g !== "object") return null;

  if (g.type === "MultiPolygon") return g as GeoJSON.MultiPolygon;
  if (g.type === "Polygon") {
    return {
      type: "MultiPolygon",
      coordinates: [g.coordinates],
    } satisfies GeoJSON.MultiPolygon;
  }
  return null;
}
