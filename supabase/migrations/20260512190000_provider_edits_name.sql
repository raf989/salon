-- Allow providers to edit their displayed name. Lives on the provider_edits
-- overlay, same merge semantics as bio / district / city.
alter table public.provider_edits
  add column if not exists name text;

notify pgrst, 'reload schema';
