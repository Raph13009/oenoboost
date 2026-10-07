-- One wine color per AOP ↔ grape link.
-- NULL = not yet classified (CMS "À classer", hidden on the public fiche).
-- is_primary stays the single role for the whole AOP.

begin;

alter table public.aop_grape_link
  add column if not exists wine_color text;

alter table public.aop_grape_link
  drop constraint if exists aop_grape_link_wine_color_check;

alter table public.aop_grape_link
  add constraint aop_grape_link_wine_color_check
  check (
    wine_color is null
    or wine_color in ('white', 'red', 'rose', 'sparkling', 'liqueur')
  );

comment on column public.aop_grape_link.wine_color is
  'Wine color this grape is used for on the AOP (white, red, rose, sparkling, liqueur). NULL until an editor classifies it. One color per grape.';

commit;
