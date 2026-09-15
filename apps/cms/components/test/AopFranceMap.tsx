"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type RegionPoint = {
  id: string;
  slug: string;
  name_fr: string;
  centroid_lat: number;
  centroid_lng: number;
  subregion_count: number;
};

type SubregionRow = {
  id: string;
  slug: string;
  name_fr: string;
  centroid_lat: number;
  centroid_lng: number;
  feature: GeoJSON.Feature<GeoJSON.Geometry>;
};

type AppellationListItem = {
  id: string;
  name_fr: string;
  slug: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
};

type Props = {
  regions: RegionPoint[];
};

const REGIONS_SOURCE_ID = "region-points";
const SUBREGION_POLYGONS_SOURCE_ID = "subregion-polygons";
const SUBREGION_POINTS_SOURCE_ID = "subregion-points";
const APPELLATION_POINTS_SOURCE_ID = "appellation-points";
const FRANCE_CENTER: [number, number] = [2.2, 46.2];
const FRANCE_ZOOM = 4.8;

function removeMapSafely(map: mapboxgl.Map) {
  try {
    map.remove();
  } catch (error) {
    if (
      error instanceof DOMException && error.name === "AbortError"
    ) {
      return;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError"
    ) {
      return;
    }
    throw error;
  }
}

function extendBoundsFromGeometry(
  bounds: mapboxgl.LngLatBounds,
  geometry: GeoJSON.Geometry
) {
  const visit = (coords: unknown) => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    const first = coords[0];
    if (
      typeof first === "number" &&
      typeof coords[1] === "number" &&
      coords.length >= 2
    ) {
      bounds.extend([first, coords[1] as number]);
      return;
    }
    for (const item of coords) visit(item);
  };

  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries) {
      extendBoundsFromGeometry(bounds, child);
    }
    return;
  }

  visit(geometry.coordinates);
}

function fitBoundsToSubregions(map: mapboxgl.Map, subregions: SubregionRow[]) {
  const bounds = new mapboxgl.LngLatBounds();
  for (const subregion of subregions) {
    extendBoundsFromGeometry(bounds, subregion.feature.geometry);
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 48,
      duration: 900,
      maxZoom: 9.5,
    });
  }
}

export function AopFranceMap({ regions }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isMountedRef = useRef(true);
  const router = useRouter();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedSubregionId, setSelectedSubregionId] = useState<string | null>(null);
  const [selectedSubregionSlug, setSelectedSubregionSlug] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedRegionSlug, setSelectedRegionSlug] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const [subregions, setSubregions] = useState<SubregionRow[]>([]);
  const [loadingRegion, setLoadingRegion] = useState(false);
  const [loadingAppellations, setLoadingAppellations] = useState(false);
  const [showAppellations, setShowAppellations] = useState(false);
  const [appellations, setAppellations] = useState<AppellationListItem[]>([]);
  const selectedRegionSlugRef = useRef<string | null>(null);
  const selectedSubregionSlugRef = useRef<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    selectedRegionSlugRef.current = selectedRegionSlug;
  }, [selectedRegionSlug]);

  useEffect(() => {
    selectedSubregionSlugRef.current = selectedSubregionSlug;
  }, [selectedSubregionSlug]);

  const regionsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: regions.map((region) => ({
        type: "Feature",
        properties: {
          id: region.id,
          slug: region.slug,
          name_fr: region.name_fr,
          subregion_count: region.subregion_count,
        },
        geometry: {
          type: "Point",
          coordinates: [region.centroid_lng, region.centroid_lat],
        },
      })),
    }),
    [regions]
  );

  const subregionPolygonsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Geometry>>(
    () => ({
      type: "FeatureCollection",
      features: subregions.map((subregion) => subregion.feature),
    }),
    [subregions]
  );

  const subregionPointsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: subregions.map((subregion) => ({
        type: "Feature",
        properties: {
          id: subregion.id,
          slug: subregion.slug,
          name_fr: subregion.name_fr,
          centroid_lat: subregion.centroid_lat,
          centroid_lng: subregion.centroid_lng,
        },
        geometry: {
          type: "Point",
          coordinates: [subregion.centroid_lng, subregion.centroid_lat],
        },
      })),
    }),
    [subregions]
  );

  const appellationPointsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: appellations
        .filter(
          (appellation): appellation is AppellationListItem & { centroid_lat: number; centroid_lng: number } =>
            appellation.centroid_lat != null && appellation.centroid_lng != null
        )
        .map((appellation) => ({
          type: "Feature",
          properties: {
            id: appellation.id,
            slug: appellation.slug,
            name_fr: appellation.name_fr,
          },
          geometry: {
            type: "Point",
            coordinates: [appellation.centroid_lng, appellation.centroid_lat],
          },
        })),
    }),
    [appellations]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapboxToken) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: FRANCE_CENTER,
      zoom: FRANCE_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(REGIONS_SOURCE_ID, {
        type: "geojson",
        data: regionsGeoJson,
      });

      map.addLayer({
        id: "region-points",
        type: "circle",
        source: REGIONS_SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": "#0f172a",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      map.addSource(SUBREGION_POLYGONS_SOURCE_ID, {
        type: "geojson",
        data: subregionPolygonsGeoJson,
      });

      map.addLayer({
        id: "subregion-fill",
        type: "fill",
        source: SUBREGION_POLYGONS_SOURCE_ID,
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#2563eb"],
          "fill-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "subregion-line",
        type: "line",
        source: SUBREGION_POLYGONS_SOURCE_ID,
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#1d4ed8"],
          "line-width": 2,
          "line-opacity": 0.95,
        },
      });

      map.addSource(SUBREGION_POINTS_SOURCE_ID, {
        type: "geojson",
        data: subregionPointsGeoJson,
      });

      map.addLayer({
        id: "subregion-points",
        type: "circle",
        source: SUBREGION_POINTS_SOURCE_ID,
        paint: {
          "circle-radius": 3.5,
          "circle-color": "#111111",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });

      map.addSource(APPELLATION_POINTS_SOURCE_ID, {
        type: "geojson",
        data: appellationPointsGeoJson,
      });

      map.addLayer({
        id: "appellation-points",
        type: "circle",
        source: APPELLATION_POINTS_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "#7f1d1d",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "appellation-labels",
        type: "symbol",
        source: APPELLATION_POINTS_SOURCE_ID,
        layout: {
          "text-field": ["get", "name_fr"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1f2937",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    });

    const showSubregionPopup = (e: mapboxgl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const name = feature?.properties?.name_fr as string | undefined;
      const id = feature?.properties?.id as string | undefined;
      const slug = feature?.properties?.slug as string | undefined;
      const latRaw = feature?.properties?.centroid_lat as number | string | undefined;
      const lngRaw = feature?.properties?.centroid_lng as number | string | undefined;
      const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
      const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
      if (!name) return;

      setSelectedName(name);
      setSelectedSubregionId(id ?? null);
      setSelectedSubregionSlug(slug ?? null);
      setShowAppellations(false);
      setAppellations([]);
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new mapboxgl.Popup({ closeButton: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${name}</strong>`)
        .addTo(map);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const nextZoom = Math.max(map.getZoom(), 9.8);
        map.easeTo({
          center: [lng, lat],
          zoom: nextZoom,
          duration: 650,
        });
      }
    };

    map.on("click", "subregion-fill", showSubregionPopup);
    map.on("click", "subregion-points", showSubregionPopup);

    const onAppellationClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const slug = feature?.properties?.slug as string | undefined;
      const regionSlug = selectedRegionSlugRef.current;
      const subregionSlug = selectedSubregionSlugRef.current;
      if (!slug || !regionSlug || !subregionSlug) return;
      router.push(`/vignoble/${regionSlug}/${subregionSlug}/${slug}`);
    };
    map.on("click", "appellation-points", onAppellationClick);
    map.on("click", "appellation-labels", onAppellationClick);

    map.on("click", "region-points", async (e) => {
      const feature = e.features?.[0];
      const id = feature?.properties?.id as string | undefined;
      const slug = feature?.properties?.slug as string | undefined;
      const name = feature?.properties?.name_fr as string | undefined;
      if (!id || !name || !slug) return;

      console.log("[map] region click", { id, name });

      setSelectedRegionId(id);
      setSelectedRegionSlug(slug);
      setSelectedRegionName(name);
      setSelectedName(null);
      setSelectedSubregionId(null);
      setSelectedSubregionSlug(null);
      setShowAppellations(false);
      setAppellations([]);
      setLoadingRegion(true);

      try {
        const res = await fetch(`/api/test/subregions-by-region/${id}`, {
          cache: "no-store",
        });
        if (!isMountedRef.current || mapRef.current !== map) return;
        console.log("[map] subregions fetch response", {
          regionId: id,
          regionName: name,
          status: res.status,
          ok: res.ok,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { subregions: SubregionRow[] };
        if (!isMountedRef.current || mapRef.current !== map) return;
        console.log("[map] subregions payload", {
          regionId: id,
          count: body.subregions.length,
          names: body.subregions.map((subregion) => subregion.name_fr),
        });
        fitBoundsToSubregions(map, body.subregions);
        setSubregions(body.subregions);
      } catch (error) {
        if (!isMountedRef.current || mapRef.current !== map) return;
        console.error("[map] subregions fetch failed", {
          regionId: id,
          regionName: name,
          error,
        });
        setSubregions([]);
      } finally {
        if (!isMountedRef.current || mapRef.current !== map) return;
        setLoadingRegion(false);
      }
    });

    for (const layerId of [
      "region-points",
      "subregion-fill",
      "subregion-points",
      "appellation-points",
      "appellation-labels",
    ]) {
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    return () => {
      mapRef.current = null;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      removeMapSafely(map);
    };
  }, [mapboxToken, router]);

  const loadAppellations = async () => {
    if (!selectedSubregionId) return;

    setLoadingAppellations(true);
    try {
      const res = await fetch(`/api/test/appellations-by-subregion/${selectedSubregionId}`, {
        cache: "no-store",
      });
      if (!isMountedRef.current) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { appellations: AppellationListItem[] };
      if (!isMountedRef.current) return;
      setAppellations(body.appellations);
      setShowAppellations(true);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("[map] appellations fetch failed", {
        selectedSubregionId,
        error,
      });
      setAppellations([]);
      setShowAppellations(true);
    } finally {
      if (!isMountedRef.current) return;
      setLoadingAppellations(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const regionsSource = map.getSource(REGIONS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (regionsSource) regionsSource.setData(regionsGeoJson);

    const polygonsSource = map.getSource(
      SUBREGION_POLYGONS_SOURCE_ID
    ) as mapboxgl.GeoJSONSource | undefined;
    if (polygonsSource) polygonsSource.setData(subregionPolygonsGeoJson);

    const pointsSource = map.getSource(
      SUBREGION_POINTS_SOURCE_ID
    ) as mapboxgl.GeoJSONSource | undefined;
    if (pointsSource) pointsSource.setData(subregionPointsGeoJson);

    const appellationPointsSource = map.getSource(
      APPELLATION_POINTS_SOURCE_ID
    ) as mapboxgl.GeoJSONSource | undefined;
    if (appellationPointsSource) appellationPointsSource.setData(appellationPointsGeoJson);
  }, [
    appellationPointsGeoJson,
    regionsGeoJson,
    subregionPointsGeoJson,
    subregionPolygonsGeoJson,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loadingRegion) return;

    if (selectedRegionId && subregions.length === 0) {
      console.log("[map] no subregions to display, reset France view", {
        selectedRegionId,
      });
      map.easeTo({
        center: FRANCE_CENTER,
        zoom: FRANCE_ZOOM,
        duration: 700,
      });
      return;
    }

    if (subregions.length === 0) return;

    fitBoundsToSubregions(map, subregions);
  }, [loadingRegion, selectedRegionId, subregions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loadingAppellations || !showAppellations) return;
    if (!selectedSubregionId) return;

    const selectedSubregion = subregions.find((subregion) => subregion.id === selectedSubregionId);
    if (!selectedSubregion) return;

    map.easeTo({
      center: [selectedSubregion.centroid_lng, selectedSubregion.centroid_lat],
      zoom: Math.max(map.getZoom(), 10.1),
      duration: 500,
    });
  }, [appellations, loadingAppellations, selectedSubregionId, showAppellations, subregions]);

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-600">
        NEXT_PUBLIC_MAPBOX_TOKEN manquant dans .env
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-white/90 px-3 py-2 text-xs text-slate-700 shadow">
        <div>{regions.length} régions chargées</div>
        <div>Clique une région pour charger ses subregions.</div>
        {selectedRegionName ? <div className="mt-1">Région: {selectedRegionName}</div> : null}
        {loadingRegion ? <div>Chargement des subregions...</div> : null}
        {selectedRegionId && !loadingRegion ? <div>{subregions.length} subregions affichées</div> : null}
        {selectedName ? <div className="mt-1 font-semibold">{selectedName}</div> : null}
        {selectedSubregionId ? (
          <div className="pointer-events-auto mt-2 space-y-2">
            <button
              type="button"
              onClick={loadAppellations}
              disabled={loadingAppellations}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              {loadingAppellations ? "Chargement..." : "Voir detail"}
            </button>
            {showAppellations ? (
              <div className="max-h-48 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                {appellations.length > 0 ? (
                  <div>{appellations.length} AOP affichees sur la carte.</div>
                ) : (
                  <div>Aucune appellation trouvée pour cette subregion.</div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
