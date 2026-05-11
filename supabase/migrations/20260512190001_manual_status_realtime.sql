-- Manual availability override stored in provider_edits.
-- Values: 'closed' (force red) or NULL (follow time-based logic).
alter table public.provider_edits
  add column if not exists manual_status text;

-- Optional sanity guard at the DB level.
do $$
begin
  if exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name   = 'provider_edits_manual_status_chk'
  ) then
    alter table public.provider_edits drop constraint provider_edits_manual_status_chk;
  end if;
end $$;

alter table public.provider_edits
  add constraint provider_edits_manual_status_chk
  check (manual_status is null or manual_status in ('open', 'closed', 'break'));

-- Enable Supabase Realtime for this table so all sessions get a push
-- whenever a provider toggles their status. `pg_publication_tables`
-- check keeps the script idempotent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'provider_edits'
  ) then
    alter publication supabase_realtime add table public.provider_edits;
  end if;
end $$;

notify pgrst, 'reload schema';
