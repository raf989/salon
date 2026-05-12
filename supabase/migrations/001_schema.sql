-- =====================================================================
-- 001 — SCHEMA
-- =====================================================================
-- All tables in the canonical, final shape. Idempotent: re-running this
-- script on an existing database is a no-op (CREATE TABLE IF NOT EXISTS,
-- ALTER TABLE ADD COLUMN IF NOT EXISTS). RLS is enabled here; the actual
-- policies live in 003_rls.sql.
--
-- Localized text fields use jsonb { az, ru }. Time-of-day uses 'HH:MM'
-- text inside jsonb to match the TypeScript shape exactly.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- services — immutable in the prototype
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id            text primary key,
  name          jsonb not null,                       -- { az, ru }
  category      text  not null,
  duration_min  int   not null,
  price         numeric not null
);

-- ---------------------------------------------------------------------
-- providers — base profile. Mutable bits live in `provider_edits`.
-- ---------------------------------------------------------------------
create table if not exists public.providers (
  id                text primary key,
  slug              text not null,
  name              text not null,
  bio               jsonb not null,                   -- { az, ru }
  rating            numeric not null,
  reviews_count     int not null default 0,
  specialties       text[] not null default '{}',
  price_range       text not null,                    -- low | medium | high
  service_ids       text[] not null default '{}',
  working_hours     jsonb not null,                   -- { start, end }
  breaks            jsonb not null default '[]'::jsonb,
  city              jsonb not null,                   -- { az, ru }
  kind              text not null,
  tier              text not null,                    -- event | beauty
  price_unit        jsonb,
  response_mins     int,
  experience_years  int,
  district          jsonb,
  gallery           text[] not null default '{}',
  avatar            text,
  verified          boolean not null default false
);

-- Unique slug + lookup index. The unique constraint already creates an
-- index, but we keep a named one matching the live DB for clarity.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'providers_slug_unique'
  ) then
    alter table public.providers
      add constraint providers_slug_unique unique (slug);
  end if;
end $$;

create index if not exists providers_slug_idx on public.providers (slug);

-- ---------------------------------------------------------------------
-- provider_edits — overlay merged on top of `providers` at read time.
-- Every column is nullable: NULL means "use the base value".
-- ---------------------------------------------------------------------
create table if not exists public.provider_edits (
  provider_id       text primary key references public.providers(id) on delete cascade,
  name              text,
  bio               jsonb,
  city              jsonb,
  district          jsonb,
  experience_years  int,
  working_hours     jsonb,
  breaks            jsonb,
  active_days       jsonb,
  gallery           text[],
  avatar            text,
  phones            jsonb,
  whatsapp          text,
  telegram          text,
  instagram         text,
  tiktok            text,
  manual_status     text,
  updated_at        timestamptz not null default now()
);

comment on column public.provider_edits.active_days is
  'Array of weekday indices (0=Sun..6=Sat) the provider is active on. NULL = all days active.';

-- Up to 3 phone numbers — enforced both at the app level and here.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_edits_phones_max3'
  ) then
    alter table public.provider_edits
      add constraint provider_edits_phones_max3
      check (phones is null or jsonb_array_length(phones) <= 3);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_edits_manual_status_chk'
  ) then
    alter table public.provider_edits
      add constraint provider_edits_manual_status_chk
      check (manual_status is null or manual_status in ('open', 'closed', 'break'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id            text primary key,
  stylist_id    text not null references public.providers(id) on delete cascade,
  client_name   text not null,
  service_id    text not null references public.services(id),
  date          date not null,
  "time"        text not null,                        -- 'HH:MM'
  status        text not null default 'upcoming',
  created_at    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_status_check'
  ) then
    alter table public.appointments
      add constraint appointments_status_check
      check (status in ('upcoming', 'completed', 'cancelled', 'no_show'));
  end if;
end $$;

create index if not exists appointments_stylist_idx        on public.appointments(stylist_id);
create index if not exists appointments_date_idx           on public.appointments(date);
create index if not exists appointments_client_name_idx    on public.appointments(client_name);
create index if not exists appointments_stylist_date_idx   on public.appointments(stylist_id, date);

-- ---------------------------------------------------------------------
-- tenders — request-for-quote authored by clients
-- ---------------------------------------------------------------------
create table if not exists public.tenders (
  id            text primary key,
  tier          text not null,
  kind          text not null,
  title         jsonb not null,
  description   jsonb not null,
  budget_min    numeric not null,
  budget_max    numeric not null,
  deadline      date not null,                        -- last day bids accepted
  opened_at     date not null default current_date,
  event_date    date,                                  -- when the work actually happens
  event_time    text,                                  -- 'HH:MM' optional
  tags          jsonb not null default '[]'::jsonb,   -- [{ az, ru }, ...]
  author_name   text not null,
  district      jsonb not null,
  created_at    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenders_event_time_format'
  ) then
    alter table public.tenders
      add constraint tenders_event_time_format
      check (event_time is null or event_time ~ '^[0-2][0-9]:[0-5][0-9]$');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- tender_bids — provider proposals on a tender
-- ---------------------------------------------------------------------
create table if not exists public.tender_bids (
  id                text primary key,
  tender_id         text not null references public.tenders(id) on delete cascade,
  provider_id       text references public.providers(id) on delete set null,
  author_user_id    text,                              -- localStorage auth id
  provider_name     text not null,
  provider_avatar   text,                              -- URL snapshot at submit
  price             numeric not null,
  note              jsonb not null,
  badges            text[] not null default '{}',
  rating            numeric,
  status            text not null default 'pending',
  created_at        timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tender_bids_status_check'
  ) then
    alter table public.tender_bids
      add constraint tender_bids_status_check
      check (status in ('pending', 'accepted', 'rejected'));
  end if;
end $$;

create index if not exists tender_bids_tender_idx on public.tender_bids(tender_id);
create index if not exists tender_bids_status_idx on public.tender_bids(status);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id            text primary key,
  provider_id   text not null references public.providers(id) on delete cascade,
  author_name   text not null,
  rating        numeric not null,
  text          jsonb not null,
  created_at    timestamptz not null default now()
);

create index if not exists reviews_provider_idx on public.reviews(provider_id);

-- ---------------------------------------------------------------------
-- Enable Row Level Security. Actual policies live in 003_rls.sql.
-- ---------------------------------------------------------------------
alter table public.services        enable row level security;
alter table public.providers       enable row level security;
alter table public.provider_edits  enable row level security;
alter table public.appointments    enable row level security;
alter table public.tenders         enable row level security;
alter table public.tender_bids     enable row level security;
alter table public.reviews         enable row level security;

notify pgrst, 'reload schema';
