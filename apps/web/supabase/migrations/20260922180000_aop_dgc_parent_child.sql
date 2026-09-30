-- Issues #22 / #9: DGC parent AOP ↔ child appellation links.
-- Children remain separate aop rows (map polygons intact).
-- child_aop_id UNIQUE → a child cannot belong to multiple parents.
--
-- is_dgc_parent on aop: editorial flag that this AOP is a parent container.
-- Complementary DGC copy lives on the link (not a full duplicate fiche).

begin;

alter table public.aop
  add column if not exists is_dgc_parent boolean not null default false;

comment on column public.aop.is_dgc_parent is
  'true = this AOP is a parent container for DGC / child appellations.';

create table if not exists public.aop_dgc_link (
  parent_aop_id integer not null references public.aop (id) on delete cascade,
  child_aop_id integer not null references public.aop (id) on delete cascade,
  explanation_fr text,
  explanation_en text,
  sort_order integer not null default 0,
  primary key (parent_aop_id, child_aop_id),
  constraint aop_dgc_link_no_self check (parent_aop_id <> child_aop_id),
  constraint aop_dgc_link_child_unique unique (child_aop_id)
);

create index if not exists aop_dgc_link_parent_idx
  on public.aop_dgc_link (parent_aop_id, sort_order);

comment on table public.aop_dgc_link is
  'Links child DGC/appellation AOPs to a parent AOP fiche (#22 / #9).';
comment on column public.aop_dgc_link.explanation_fr is
  'Short FR explanation shown in the parent fiche DGC section.';
comment on column public.aop_dgc_link.explanation_en is
  'Short EN explanation shown in the parent fiche DGC section.';

alter table public.aop_dgc_link enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.aop_dgc_link'::regclass
       and polname  = 'public read aop_dgc_link'
  ) then
    create policy "public read aop_dgc_link"
      on public.aop_dgc_link for select using (true);
  end if;
end $$;

commit;
