-- =====================================================================
-- 005 — STORAGE
-- =====================================================================
-- Public bucket `provider-images` for avatars and gallery uploads.
-- Anonymous read+write — matches the demo-open RLS in 003_rls.sql.
-- Tighten when real auth lands (insert/update/delete should require
-- ownership of the matching provider).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-images',
  'provider-images',
  true,
  5 * 1024 * 1024,                                    -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Drop and recreate so re-runs always end up with the canonical policy set.
drop policy if exists "provider-images public read"   on storage.objects;
drop policy if exists "provider-images public insert" on storage.objects;
drop policy if exists "provider-images public update" on storage.objects;
drop policy if exists "provider-images public delete" on storage.objects;

create policy "provider-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'provider-images');

create policy "provider-images public insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'provider-images');

create policy "provider-images public update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'provider-images');

create policy "provider-images public delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'provider-images');
