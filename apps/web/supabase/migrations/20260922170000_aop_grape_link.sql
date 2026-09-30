-- Issues #18 / #11 / #5: structured AOP ↔ grape links with main vs accessory.
-- is_primary = true  → main/classic (free preview + full fiche)
-- is_primary = false → accessory (full fiche only)
--
-- Idempotent. No DROP of legacy appellation_grape_links (historical backup).

begin;

create table if not exists public.aop_grape_link (
  aop_id integer not null references public.aop (id) on delete cascade,
  grape_id uuid not null references public.grapes (id) on delete cascade,
  is_primary boolean not null default true,
  primary key (aop_id, grape_id)
);

create index if not exists aop_grape_link_grape_idx
  on public.aop_grape_link (grape_id);

create index if not exists aop_grape_link_aop_primary_idx
  on public.aop_grape_link (aop_id, is_primary);

comment on column public.aop_grape_link.is_primary is
  'true = main/classic grape; false = accessory grape.';

alter table public.aop_grape_link enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.aop_grape_link'::regclass
       and polname  = 'public read aop_grape_link'
  ) then
    create policy "public read aop_grape_link"
      on public.aop_grape_link for select using (true);
  end if;
end $$;

-- Best-effort backfill from legacy appellation_grape_links via name join.
insert into public.aop_grape_link (aop_id, grape_id, is_primary)
select distinct
  a.id as aop_id,
  agl.grape_id,
  coalesce(agl.is_primary, true) as is_primary
from public.appellation_grape_links agl
join public.appellations ap
  on ap.id = agl.appellation_id
 and ap.deleted_at is null
join public.aop a
  on lower(trim(a.name)) = lower(trim(ap.name_fr))
 and a.deleted_at is null
on conflict (aop_id, grape_id) do nothing;

commit;
