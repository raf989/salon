-- =====================================================================
-- 004 — REALTIME
-- =====================================================================
-- Add the live-replicated tables to the `supabase_realtime` publication.
-- Idempotent: skips tables that are already in the publication.
--
-- Subscribed surface:
--   appointments    — dashboard + catalog "available today" badge
--   provider_edits  — live profile / status / hours updates
--   tenders         — new tenders appear without F5
--   tender_bids     — new bids + status changes propagate
-- =====================================================================

do $$
declare
  t text;
  tables text[] := array[
    'appointments',
    'provider_edits',
    'tenders',
    'tender_bids'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname    = 'supabase_realtime'
        and schemaname = 'public'
        and tablename  = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I;', t
      );
    end if;
  end loop;
end $$;
