-- Issue #36: mouth flavours (aroma ids) + texture descriptors
alter table public.tasting_sheets
  add column if not exists mouth_flavours text[] null,
  add column if not exists mouth_texture text[] null;

comment on column public.tasting_sheets.mouth_flavours is
  'Selected mouth flavour aroma ids (independent from nose_aroma_families); catalog shared with #35';

comment on column public.tasting_sheets.mouth_texture is
  'Selected mouth texture descriptors (douce, soyeuse, …)';
