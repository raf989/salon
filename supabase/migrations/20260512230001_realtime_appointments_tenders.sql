-- Add appointments + tender_bids + tenders to the realtime publication so
-- the dashboard sees new bookings without a manual refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tenders'
  ) then
    alter publication supabase_realtime add table public.tenders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tender_bids'
  ) then
    alter publication supabase_realtime add table public.tender_bids;
  end if;
end $$;
