-- Add overlay columns for fields that providers can edit from their dashboard:
-- city (in addition to the existing district), working_hours, and breaks.
alter table public.provider_edits
  add column if not exists city          jsonb,
  add column if not exists working_hours jsonb,
  add column if not exists breaks        jsonb;

-- Force PostgREST to drop its cached view of the table. Without this it can
-- keep returning PGRST204 ("column not found in schema cache") for up to a
-- few minutes after the columns are actually added.
notify pgrst, 'reload schema';
