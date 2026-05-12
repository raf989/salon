-- Public bucket for provider avatars + galleries. Anonymous read; anonymous
-- write is fine for the prototype (matches the project's demo-open RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-images',
  'provider-images',
  true,
  5 * 1024 * 1024, -- 5 MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone can read (the bucket is public, but explicit policy is required for select).
drop policy if exists "provider-images public read" on storage.objects;
create policy "provider-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'provider-images');

-- Anyone can insert (prototype-only -- tighten when auth is real).
drop policy if exists "provider-images public insert" on storage.objects;
create policy "provider-images public insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'provider-images');

drop policy if exists "provider-images public update" on storage.objects;
create policy "provider-images public update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'provider-images');

drop policy if exists "provider-images public delete" on storage.objects;
create policy "provider-images public delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'provider-images');
