import type { ClimateType } from "@/types/database";

export type { ClimateType };

export type RelatedClimateRegion = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  is_primary: boolean;
};

export type RelatedClimateGrape = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  type: "red" | "white" | "rose";
};

export type ClimateMapFeatureProperties = {
  region_id: string;
  region_slug: string;
  region_name_fr: string;
  region_name_en: string;
  climate_id: string;
  climate_slug: string;
  climate_name_fr: string;
  climate_name_en: string;
  color_hex: string;
  secondary_climate_slugs: string[];
};

export type ClimateMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: ClimateMapFeatureProperties;
    geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
  }>;
};
