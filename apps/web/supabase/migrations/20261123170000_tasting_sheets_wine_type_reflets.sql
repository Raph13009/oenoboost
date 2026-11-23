-- Issue #34: wine type (blanc/rouge/rosé) + eye reflets on tasting sheets
alter table public.tasting_sheets
  add column if not exists wine_type text null,
  add column if not exists eye_reflets text null;

comment on column public.tasting_sheets.wine_type is
  'Wine colour family selected at tasting start: white | red | rose';

comment on column public.tasting_sheets.eye_reflets is
  'Selected robe-reflection shade id (same palette as eye_color for wine_type)';

alter table public.tasting_sheets
  drop constraint if exists tasting_sheets_wine_type_check;

alter table public.tasting_sheets
  add constraint tasting_sheets_wine_type_check
  check (wine_type is null or wine_type in ('white', 'red', 'rose'));
