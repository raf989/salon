-- =====================================================================
-- Salon prototype — initial schema
-- =====================================================================
-- Localized text fields are stored as { az, ru } jsonb objects.
-- Time-of-day values for working_hours and breaks are stored as 'HH:MM'
-- strings inside jsonb, matching the TypeScript shape exactly.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- services (immutable in prototype; could be edited per-provider later)
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id            text primary key,
  name          jsonb not null,                      -- { az, ru }
  category      text not null,
  duration_min  int  not null,
  price         numeric not null
);

-- ---------------------------------------------------------------------
-- providers (base profile; mutable bits live in provider_edits overlay)
-- ---------------------------------------------------------------------
create table if not exists public.providers (
  id                text primary key,
  name              text not null,
  bio               jsonb not null,                  -- { az, ru }
  rating            numeric not null,
  reviews_count     int not null default 0,
  specialties       text[] not null default '{}',
  price_range       text not null,                   -- low | medium | high
  service_ids       text[] not null default '{}',
  working_hours     jsonb not null,                  -- { start: 'HH:MM', end: 'HH:MM' }
  breaks            jsonb not null default '[]'::jsonb,
  city              jsonb not null,                  -- { az, ru }
  kind              text not null,
  tier              text not null,                   -- event | beauty
  price_unit        jsonb,
  response_mins     int,
  experience_years  int,
  district          jsonb,
  gallery           text[] not null default '{}',
  avatar            text,
  verified          boolean not null default false
);

-- ---------------------------------------------------------------------
-- provider_edits (overlay, merged on top of providers row in queries)
-- ---------------------------------------------------------------------
create table if not exists public.provider_edits (
  provider_id       text primary key references public.providers(id) on delete cascade,
  bio               jsonb,
  district          jsonb,
  experience_years  int,
  gallery           text[],
  avatar            text,
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id            text primary key,
  stylist_id    text not null references public.providers(id) on delete cascade,
  client_name   text not null,
  service_id    text not null references public.services(id),
  date          date not null,
  "time"        text not null,                       -- 'HH:MM'
  status        text not null default 'upcoming',    -- upcoming | completed | cancelled
  created_at    timestamptz not null default now()
);
create index if not exists appointments_stylist_idx on public.appointments(stylist_id);
create index if not exists appointments_date_idx    on public.appointments(date);

-- ---------------------------------------------------------------------
-- tenders + bids
-- ---------------------------------------------------------------------
create table if not exists public.tenders (
  id            text primary key,
  tier          text not null,
  kind          text not null,
  title         jsonb not null,
  description   jsonb not null,
  budget_min    numeric not null,
  budget_max    numeric not null,
  deadline      date not null,
  opened_at     date not null default current_date,
  tags          jsonb not null default '[]'::jsonb,  -- [{ az, ru }, ...]
  author_name   text not null,
  district      jsonb not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.tender_bids (
  id              text primary key,
  tender_id       text not null references public.tenders(id) on delete cascade,
  provider_id     text references public.providers(id) on delete set null,
  provider_name   text not null,
  price           numeric not null,
  note            jsonb not null,
  badges          text[] not null default '{}',
  rating          numeric,
  created_at      timestamptz not null default now()
);
create index if not exists tender_bids_tender_idx on public.tender_bids(tender_id);

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

-- =====================================================================
-- RLS — DEMO POLICIES (open access for the anon role)
-- =====================================================================
-- WARNING: these policies allow anyone with the anon key to read AND
-- mutate every row. This matches the prototype's prior localStorage
-- behaviour where the browser already had full control. Replace before
-- production. All policy names start with `demo_` for easy grep + drop.
-- =====================================================================

alter table public.providers       enable row level security;
alter table public.provider_edits  enable row level security;
alter table public.services        enable row level security;
alter table public.appointments    enable row level security;
alter table public.tenders         enable row level security;
alter table public.tender_bids     enable row level security;
alter table public.reviews         enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'providers', 'provider_edits', 'services', 'appointments',
    'tenders', 'tender_bids', 'reviews'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "demo_select_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_insert_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_update_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_delete_%1$s" on public.%1$I;', t);

    execute format(
      'create policy "demo_select_%1$s" on public.%1$I for select to anon, authenticated using (true);',
      t
    );
    execute format(
      'create policy "demo_insert_%1$s" on public.%1$I for insert to anon, authenticated with check (true);',
      t
    );
    execute format(
      'create policy "demo_update_%1$s" on public.%1$I for update to anon, authenticated using (true) with check (true);',
      t
    );
    execute format(
      'create policy "demo_delete_%1$s" on public.%1$I for delete to anon, authenticated using (true);',
      t
    );
  end loop;
end $$;
