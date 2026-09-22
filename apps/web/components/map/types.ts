/* eslint-disable @typescript-eslint/no-explicit-any */

export type VignobleMapRegion = {
  region_id: string;
  region_slug: string;
  name: string;
  geojson: any;
  color_hex: string | null;
  department_count: number | null;
  area_hectares: number | null;
  total_production_hl: number | null;
  main_grapes: string | null;
};

export type SubregionLegendItem = {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
  areaHectares: number | null;
  description: string | null;
};

export type VignobleMapStrings = {
  discover: string;
  backToRegions: string;
  backToRegion: string;
  subregionsLayer: string;
  aopLayer: string;
  closeLabel: string;
  departmentsLabel: string;
  hectaresLabel: string;
  totalProductionLabel: string;
  grapesLabel: string;
  historyTimelineTitle: string;
  historyTimelineHint: string;
  footerInfoTab: string;
  footerHistoryTab: string;
  footerPanelToggleAria: string;
  openAopDetail: string;
  loading: string;
  na: string;
};

export type VignobleMapLocale = "fr" | "en";
