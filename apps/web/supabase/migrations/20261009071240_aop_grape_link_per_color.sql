-- Allow the same grape under multiple wine colors on one AOP
-- (e.g. Syrah for red and again for rosé). Role (is_primary) stays
-- per link row. Unclassified rows keep wine_color NULL (at most one).

begin;

alter table public.aop_grape_link
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.aop_grape_link
  drop constraint if exists aop_grape_link_pkey;

alter table public.aop_grape_link
  add constraint aop_grape_link_pkey primary key (id);

alter table public.aop_grape_link
  drop constraint if exists aop_grape_link_aop_grape_color_key;

alter table public.aop_grape_link
  add constraint aop_grape_link_aop_grape_color_key
  unique nulls not distinct (aop_id, grape_id, wine_color);

comment on column public.aop_grape_link.wine_color is
  'Wine color this grape is used for on the AOP (white, red, rose, sparkling, liqueur). NULL until an editor classifies it. Same grape may appear once per color.';

comment on column public.aop_grape_link.is_primary is
  'true = main/classic grape for this color link; false = accessory for this color link.';

commit;
