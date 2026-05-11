-- Contact channels surfaced on the provider dashboard. `phones` holds up to
-- three E.164 strings as a JSON array; the others are simple strings.
alter table public.provider_edits
  add column if not exists phones    jsonb,
  add column if not exists whatsapp  text,
  add column if not exists instagram text,
  add column if not exists tiktok    text;

-- Optional sanity guard: enforce the 3-phone limit at the database level too.
-- Drop and re-create idempotently in case the constraint name already exists.
do $$
begin
  if exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name   = 'provider_edits_phones_max3'
  ) then
    alter table public.provider_edits drop constraint provider_edits_phones_max3;
  end if;
end $$;

alter table public.provider_edits
  add constraint provider_edits_phones_max3
  check (phones is null or jsonb_array_length(phones) <= 3);

-- Tell PostgREST to drop its cached view of the table — otherwise the next
-- upsert can keep failing with PGRST204 for a few minutes.
notify pgrst, 'reload schema';
