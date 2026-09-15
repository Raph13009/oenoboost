-- Supabase Storage setup for CMS soil photos
-- The column public.soil_types.photo_url already exists in this project.
-- This script creates a public bucket dedicated to cropped 16:9 soil images.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'soil-photos',
  'soil-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for images
drop policy if exists "Public can read soil photos" on storage.objects;
create policy "Public can read soil photos"
on storage.objects
for select
to public
using (bucket_id = 'soil-photos');

-- Optional:
-- If you ever want authenticated users (non-service-role) to upload from the dashboard directly,
-- uncomment one of the policies below and adapt the condition to your auth model.

-- create policy "Authenticated users can upload soil photos"
-- on storage.objects
-- for insert
-- to authenticated
-- with check (bucket_id = 'soil-photos');

-- create policy "Authenticated users can update soil photos"
-- on storage.objects
-- for update
-- to authenticated
-- using (bucket_id = 'soil-photos')
-- with check (bucket_id = 'soil-photos');

-- create policy "Authenticated users can delete soil photos"
-- on storage.objects
-- for delete
-- to authenticated
-- using (bucket_id = 'soil-photos');
