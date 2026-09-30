-- Issue #10: private Premium user notes on AOP fiches.
-- One note per (user, aop). RLS: owner-only. Premium enforced in app actions.

begin;

create table if not exists public.user_aop_notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  aop_id integer not null references public.aop (id) on delete cascade,
  body text not null default '',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint user_aop_notes_pkey primary key (id),
  constraint user_aop_notes_user_aop_unique unique (user_id, aop_id)
);

create index if not exists user_aop_notes_user_idx
  on public.user_aop_notes (user_id);

create index if not exists user_aop_notes_aop_idx
  on public.user_aop_notes (aop_id);

comment on table public.user_aop_notes is
  'Private per-user notes on an AOP fiche (Premium). Issue #10.';

alter table public.user_aop_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.user_aop_notes'::regclass
       and polname = 'Users can select own aop notes'
  ) then
    create policy "Users can select own aop notes"
      on public.user_aop_notes for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.user_aop_notes'::regclass
       and polname = 'Users can insert own aop notes'
  ) then
    create policy "Users can insert own aop notes"
      on public.user_aop_notes for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.user_aop_notes'::regclass
       and polname = 'Users can update own aop notes'
  ) then
    create policy "Users can update own aop notes"
      on public.user_aop_notes for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policy
     where polrelid = 'public.user_aop_notes'::regclass
       and polname = 'Users can delete own aop notes'
  ) then
    create policy "Users can delete own aop notes"
      on public.user_aop_notes for delete
      using (auth.uid() = user_id);
  end if;
end $$;

commit;
