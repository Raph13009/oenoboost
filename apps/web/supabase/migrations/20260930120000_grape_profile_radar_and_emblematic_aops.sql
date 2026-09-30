-- Issue #7 / #20: grape profile radar (0–8) + curated emblematic AOP links.
-- Keeps legacy emblematic_wines_* text columns (no silent delete).
-- Idempotent.

begin;

alter table public.grapes
  add column if not exists radar_acidity smallint,
  add column if not exists radar_body smallint,
  add column if not exists radar_aromatic_intensity smallint,
  add column if not exists radar_tannins smallint,
  add column if not exists radar_alcohol_potential smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'grapes_radar_acidity_range'
       and conrelid = 'public.grapes'::regclass
  ) then
    alter table public.grapes
      add constraint grapes_radar_acidity_range
      check (radar_acidity is null or (radar_acidity >= 0 and radar_acidity <= 8));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'grapes_radar_body_range'
       and conrelid = 'public.grapes'::regclass
  ) then
    alter table public.grapes
      add constraint grapes_radar_body_range
      check (radar_body is null or (radar_body >= 0 and radar_body <= 8));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'grapes_radar_aromatic_intensity_range'
       and conrelid = 'public.grapes'::regclass
  ) then
    alter table public.grapes
      add constraint grapes_radar_aromatic_intensity_range
      check (
        radar_aromatic_intensity is null
        or (radar_aromatic_intensity >= 0 and radar_aromatic_intensity <= 8)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'grapes_radar_tannins_range'
       and conrelid = 'public.grapes'::regclass
  ) then
    alter table public.grapes
      add constraint grapes_radar_tannins_range
      check (radar_tannins is null or (radar_tannins >= 0 and radar_tannins <= 8));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'grapes_radar_alcohol_potential_range'
       and conrelid = 'public.grapes'::regclass
  ) then
    alter table public.grapes
      add constraint grapes_radar_alcohol_potential_range
      check (
        radar_alcohol_potential is null
        or (radar_alcohol_potential >= 0 and radar_alcohol_potential <= 8)
      );
  end if;
end $$;

comment on column public.grapes.radar_acidity is
  'Profil du cépage axis: acidity, scale 0–8.';
comment on column public.grapes.radar_body is
  'Profil du cépage axis: body / power, scale 0–8.';
comment on column public.grapes.radar_aromatic_intensity is
  'Profil du cépage axis: aromatic intensity, scale 0–8.';
comment on column public.grapes.radar_tannins is
  'Profil du cépage axis: tannins, scale 0–8.';
comment on column public.grapes.radar_alcohol_potential is
  'Profil du cépage axis: alcohol potential, scale 0–8.';

create table if not exists public.grape_emblematic_aop_link (
  grape_id uuid not null references public.grapes (id) on delete cascade,
  aop_id integer not null references public.aop (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (grape_id, aop_id)
);

create index if not exists grape_emblematic_aop_link_grape_idx
  on public.grape_emblematic_aop_link (grape_id, sort_order);

create index if not exists grape_emblematic_aop_link_aop_idx
  on public.grape_emblematic_aop_link (aop_id);

comment on table public.grape_emblematic_aop_link is
  'Curated emblematic AOPs shown on the grape fiche (issue #7 / #20).';

alter table public.grape_emblematic_aop_link enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.grape_emblematic_aop_link'::regclass
       and polname  = 'public read grape_emblematic_aop_link'
  ) then
    create policy "public read grape_emblematic_aop_link"
      on public.grape_emblematic_aop_link for select using (true);
  end if;
end $$;

commit;
