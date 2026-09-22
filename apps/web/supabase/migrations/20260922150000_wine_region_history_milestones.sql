-- Issue #21: ordered history milestones per wine region.
-- Period is free-text (FR/EN), not a date type — client content uses years and periods.
-- Idempotent + transactional: safe to paste into the Supabase SQL editor.

begin;

create table if not exists public.wine_region_history_milestones (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.wine_regions (id) on delete cascade,
  milestone_order integer not null,
  period_label_fr character varying(100) not null default '',
  period_label_en character varying(100) not null default '',
  title_fr character varying(255) not null default '',
  title_en character varying(255) not null default '',
  detail_fr text,
  detail_en text,
  icon_url text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint wine_region_history_milestones_region_order_unique unique (region_id, milestone_order)
);

create index if not exists idx_wine_region_history_milestones_region
  on public.wine_region_history_milestones (region_id);

comment on table public.wine_region_history_milestones is
  'Ordered historical timeline milestones for a wine region (CMS-managed).';

comment on column public.wine_region_history_milestones.period_label_fr is
  'Free-text date or period label (e.g. 1855, XIIe siècle). Not a typed date.';

alter table public.wine_region_history_milestones enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wine_region_history_milestones'
      and policyname = 'wine_region_history_milestones_public_read'
  ) then
    create policy wine_region_history_milestones_public_read
      on public.wine_region_history_milestones
      for select
      to anon, authenticated
      using (
        exists (
          select 1 from public.wine_regions wr
          where wr.id = region_id
            and wr.deleted_at is null
            and wr.status = 'published'
        )
      );
  end if;
end $$;

commit;
