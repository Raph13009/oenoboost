-- Normalize AOP slugs to URL-safe kebab-case.
-- Hand-created DGCs were saved with spaces/accents (e.g.
-- "côtes-de-provence sainte-victoire"), which Next.js route params keep
-- percent-encoded, so the detail page 404s.

create extension if not exists unaccent;

create or replace function public.aop_fill_slug()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  source text;
begin
  source := coalesce(nullif(trim(new.slug), ''), new.name);
  new.slug := trim(
    both '-' from
    regexp_replace(
      lower(unaccent(trim(source))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  if new.slug is null or new.slug = '' then
    new.slug := 'aop';
  end if;
  return new;
end;
$$;

drop trigger if exists aop_fill_slug on public.aop;
create trigger aop_fill_slug
  before insert or update of slug, name on public.aop
  for each row execute function public.aop_fill_slug();

update public.aop
set slug = slug
where slug ~ '[^a-z0-9-]';
