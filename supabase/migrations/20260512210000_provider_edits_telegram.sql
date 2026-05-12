-- Telegram contact channel. Stored as a plain handle string (without @);
-- the UI composes the t.me URL on display.
alter table public.provider_edits
  add column if not exists telegram text;

-- PostgREST schema cache flush so the next upsert doesn't fail with PGRST204.
notify pgrst, 'reload schema';
