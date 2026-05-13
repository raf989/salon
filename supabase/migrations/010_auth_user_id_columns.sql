-- =====================================================================
-- 010 — AUTH USER ID COLUMNS
-- =====================================================================
-- Adds `auth_user_id text` to every table whose rows have a clear owner.
-- Owner = Firebase UID (the JWT `sub` claim), routed into Supabase via
-- Third-Party Auth → Firebase. After this migration we have the column
-- in place but no policy enforcement yet — that lands in 011.
--
-- All columns are nullable on purpose:
--   • Existing seed rows (mock providers, mock tenders) have no Firebase
--     user yet — they stay anonymous until an admin assigns them.
--   • `appointments.auth_user_id` can stay null for guest bookings
--     (client books without an account).
--
-- `tender_bids.author_user_id` already exists from migration 001; it's
-- repurposed to hold Firebase UIDs going forward. Legacy values that
-- look like `u_<rand>` (localStorage IDs from the demo era) effectively
-- become anonymous bids once the mock auth slice is stripped.
-- =====================================================================

alter table public.providers       add column if not exists auth_user_id text;
alter table public.tenders         add column if not exists auth_user_id text;
alter table public.reviews         add column if not exists auth_user_id text;
alter table public.appointments    add column if not exists auth_user_id text;

-- Indexes — every owner check in RLS will scan by `auth_user_id`. Partial
-- indexes skip the null rows so the index stays small even with lots of
-- legacy/seed data.
create index if not exists providers_auth_user_idx
  on public.providers (auth_user_id) where auth_user_id is not null;

create index if not exists tenders_auth_user_idx
  on public.tenders (auth_user_id) where auth_user_id is not null;

create index if not exists reviews_auth_user_idx
  on public.reviews (auth_user_id) where auth_user_id is not null;

create index if not exists appointments_auth_user_idx
  on public.appointments (auth_user_id) where auth_user_id is not null;

-- tender_bids.author_user_id already has tender_bids_unique_author_per_tender
-- (migration 007); reuse it.

comment on column public.providers.auth_user_id is
  'Firebase UID of the profile owner. Null = legacy/seed/admin-managed.';
comment on column public.tenders.auth_user_id is
  'Firebase UID of the client who posted the tender. Null = legacy.';
comment on column public.reviews.auth_user_id is
  'Firebase UID of the reviewer. Null = anonymous review (pre-auth era).';
comment on column public.appointments.auth_user_id is
  'Firebase UID of the booking client. Null = guest booking (no account).';

notify pgrst, 'reload schema';
