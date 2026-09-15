"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapPoint = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  href: string;
};

type Props = {
  title: string;
  subtitle: string;
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
};

const SOURCE_ID = "vignoble-points";
const LAYER_ID = "vignoble-points-layer";

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

function boundsFromPoints(points: MapPoint[]): mapboxgl.LngLatBounds | null {
  if (points.length === 0) return null;
  const bounds = new mapboxgl.LngLatBounds();
  for (const point of points) {
    bounds.extend([point.lng, point.lat]);
  }
  return bounds.isEmpty() ? null : bounds;
}

export function VignoblePointsMap({ title, subtitle, points, center, zoom }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const router = useRouter();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const data = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        properties: {
          id: point.id,
          name: point.name,
          slug: point.slug,
          href: point.href,
        },
        geometry: {
          type: "Point",
          coordinates: [point.lng, point.lat],
        },
      })),
    }),
    [points]
  );

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center ?? [2.2, 46.2],
      zoom: zoom ?? 5,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": "#0f172a",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });
    });

    map.on("click", LAYER_ID, (event) => {
      const feature = event.features?.[0];
      const href = feature?.properties?.href as string | undefined;
      if (!href) return;
      router.push(href);
    });

    map.on("mouseenter", LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      mapRef.current = null;
      removeMapSafely(map);
    };
  }, [center, data, router, token, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) source.setData(data);

    if (points.length === 0) return;
    const bounds = boundsFromPoints(points);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 50,
        duration: 700,
        maxZoom: 11,
      });
    }
  }, [data, points]);

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center rounded border border-slate-200 bg-slate-50 text-sm text-slate-600">
        NEXT_PUBLIC_MAPBOX_TOKEN manquant dans .env
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded border border-slate-200">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-white/90 px-3 py-2 text-xs text-slate-700 shadow">
        <div className="font-semibold text-slate-900">{title}</div>
        <div>{subtitle}</div>
        <div className="mt-1">{points.length} points</div>
      </div>
    </div>
  );
}
