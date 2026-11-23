-- Issue #35: structured first/second nose fields
alter table public.tasting_sheets
  add column if not exists nose_first_intensity text null,
  add column if not exists nose_first_families text[] null,
  add column if not exists nose_plus text null;

comment on column public.tasting_sheets.nose_first_intensity is
  'First-nose aromatic intensity: light | medium | pronounced';

comment on column public.tasting_sheets.nose_first_families is
  'High-level aroma family ids selected at first nose (no detailed aromas)';

comment on column public.tasting_sheets.nose_plus is
  'Le + sur ta dégust’’ qualifier id (plaisant, elegant, …)';

comment on column public.tasting_sheets.nose_aroma_families is
  'Second-nose detailed aroma ids from Hortense catalog (independent from mouth_flavours)';

comment on column public.tasting_sheets.nose_intensity is
  'Second-nose aromatic intensity: light | medium | pronounced';

comment on column public.tasting_sheets.nose_notes is
  'Nose conclusion free text (maturité, origine, cépage, âge…)';
