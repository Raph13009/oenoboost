"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { useMapboxMap } from "@/components/map/use-mapbox-map";
import {
  computeMultiPolygonBounds,
  unionBounds,
  type Bounds,
} from "@/components/map/geo/geometry";
import { raisePlaceLabelsToTop } from "@/components/map/map-label-utils";
import type {
  ClimateMapFeatureCollection,
  ClimateType,
} from "../types";

const SOURCE_ID = "climate-regions";
const FILL_LAYER_ID = "climate-regions-fill";
const LINE_LAYER_ID = "climate-regions-line";

type Props = {
  geojson: ClimateMapFeatureCollection;
  climates: ClimateType[];
  locale: Locale;
  legendTitle: string;
  secondaryLabel: string;
  mapHint: string;
};

function featureBounds(
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon,
): Bounds | null {
  if (geometry.type === "MultiPolygon") {
    return computeMultiPolygonBounds(geometry);
  }
  return computeMultiPolygonBounds({
    type: "MultiPolygon",
    coordinates: [geometry.coordinates],
  });
}

export function ClimateMap({
  geojson,
  climates,
  locale,
  legendTitle,
  secondaryLabel,
  mapHint,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { map, ready } = useMapboxMap(containerRef, {
    center: [2.5, 46.5],
    zoom: 4.6,
  });
  const [activeClimateSlug, setActiveClimateSlug] = useState<string | null>(
    null,
  );
  const [popup, setPopup] = useState<{
    regionName: string;
    climateName: string;
    climateSlug: string;
    secondary: string[];
  } | null>(null);

  const climateBySlug = useMemo(() => {
    return new Map(climates.map((c) => [c.slug, c]));
  }, [climates]);

  const franceFit = useMemo(() => {
    return unionBounds(
      geojson.features.map((f) => featureBounds(f.geometry)),
    );
  }, [geojson]);

  const filteredGeojson = useMemo(() => {
    if (!activeClimateSlug) return geojson;
    return {
      type: "FeatureCollection" as const,
      features: geojson.features.filter((f) => {
        const props = f.properties;
        return (
          props.climate_slug === activeClimateSlug ||
          (props.secondary_climate_slugs ?? []).includes(activeClimateSlug)
        );
      }),
    };
  }, [geojson, activeClimateSlug]);

  useEffect(() => {
    if (!map || !ready) return;

    const onClick = (e: any) => {
      const feature = e.features?.[0];
      if (!feature?.properties) return;
      const climateSlug = feature.properties.climate_slug as string;
      const regionName =
        locale === "en"
          ? (feature.properties.region_name_en as string)
          : (feature.properties.region_name_fr as string);
      const climateName =
        locale === "en"
          ? (feature.properties.climate_name_en as string)
          : (feature.properties.climate_name_fr as string);
      let secondary: string[] = [];
      try {
        const raw = feature.properties.secondary_climate_slugs;
        secondary = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
            ? (JSON.parse(raw) as string[])
            : [];
      } catch {
        secondary = [];
      }
      setPopup({
        regionName,
        climateName,
        climateSlug,
        secondary,
      });
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: filteredGeojson,
        promoteId: "region_id",
      });
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": ["get", "color_hex"],
          "fill-opacity": 0.62,
        },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#4a3728",
          "line-width": 0.8,
          "line-opacity": 0.45,
        },
      });
      raisePlaceLabelsToTop(map);
      if (franceFit) {
        map.fitBounds(franceFit, { padding: 40, duration: 0 });
      }
    } else {
      const source = map.getSource(SOURCE_ID);
      if (source) source.setData(filteredGeojson);
    }

    map.on("click", FILL_LAYER_ID, onClick);
    map.on("mouseenter", FILL_LAYER_ID, onEnter);
    map.on("mouseleave", FILL_LAYER_ID, onLeave);

    return () => {
      map.off("click", FILL_LAYER_ID, onClick);
      map.off("mouseenter", FILL_LAYER_ID, onEnter);
      map.off("mouseleave", FILL_LAYER_ID, onLeave);
    };
  }, [map, ready, filteredGeojson, franceFit, locale]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div ref={containerRef} className="h-[22rem] w-full md:h-[28rem]" />

        {popup ? (
          <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-white/70 bg-white/95 p-3 shadow-md backdrop-blur-sm md:left-auto md:right-3 md:w-72">
            <p className="text-sm font-semibold text-foreground">
              {popup.regionName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {popup.climateName}
            </p>
            {popup.secondary.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {secondaryLabel}:{" "}
                {popup.secondary
                  .map((slug) => {
                    const c = climateBySlug.get(slug);
                    if (!c) return slug;
                    return locale === "en" ? c.name_en : c.name_fr;
                  })
                  .join(", ")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(`/climat/${popup.climateSlug}`)}
              className="mt-3 inline-flex rounded-full bg-wine px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-wine/90"
            >
              {popup.climateName}
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 md:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {legendTitle}
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {climates.map((climate) => {
            const name =
              locale === "en" ? climate.name_en : climate.name_fr;
            const active = activeClimateSlug === climate.slug;
            return (
              <li key={climate.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveClimateSlug((prev) =>
                      prev === climate.slug ? null : climate.slug,
                    );
                    setPopup(null);
                  }}
                  onDoubleClick={() => router.push(`/climat/${climate.slug}`)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-wine/40 bg-accent text-wine"
                      : "border-border bg-background text-foreground hover:border-wine/30 hover:text-wine"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                    style={{ backgroundColor: climate.color_hex ?? "#888" }}
                  />
                  <span>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground md:text-xs">
          {mapHint}
        </p>
      </div>
    </div>
  );
}
