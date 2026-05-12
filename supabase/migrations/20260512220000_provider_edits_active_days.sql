-- Active weekdays for a provider. Stored as a jsonb array of weekday indices
-- (0..6, Sunday = 0) matching the order used by `lib/i18n.ts` weekday keys.
-- A NULL value means "all days active" — this preserves backwards-compatible
-- behaviour for rows that pre-date this column.
alter table public.provider_edits
  add column if not exists active_days jsonb;

comment on column public.provider_edits.active_days is
  'Array of weekday indices (0=Sun..6=Sat) the provider is active on. NULL = all days active.';

-- PostgREST schema cache flush so the next upsert doesn't fail with PGRST204.
notify pgrst, 'reload schema';
