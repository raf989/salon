-- =====================================================================
-- 012 — USERS TABLE (server-side profile)
-- =====================================================================
-- Until now a registered user's profile (name, role, kind, email) lived
-- ONLY in browser localStorage. That broke logging in on a second device
-- — the UID authenticates but there's no name/role to show.
--
-- This table makes the profile server-side and recoverable on any device.
-- Keyed by Firebase UID (the JWT `sub`). Providers ALSO get a row in
-- `providers` (with `auth_user_id` matching) for their business profile;
-- this table is just the lightweight identity record for everyone.
--
-- Apply order: this can run before OR after 011 — both define
-- `firebase_uid()` with `create or replace`, so whichever runs first wins
-- and the second is a harmless no-op.
-- =====================================================================

-- ---------------------------------------------------------------------
-- firebase_uid() — read the Firebase UID from the current request's JWT.
-- Duplicated from 011 so 012 is self-contained (Batch A applies 012 but
-- defers 011). Identical definition — create or replace is idempotent.
-- ---------------------------------------------------------------------
create or replace function public.firebase_uid()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb ->> 'sub',
    ''
  );
$$;

comment on function public.firebase_uid() is
  'Returns the JWT sub (Firebase UID) for the current request, NULL for anon.';

-- ---------------------------------------------------------------------
-- users — one row per authenticated person.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  auth_user_id  text primary key,                 -- Firebase UID
  name          text not null,
  role          text not null,                    -- 'client' | 'provider'
  kind          text,                             -- provider kind; null for clients
  email         text,                             -- providers only
  phone         text not null,                    -- E.164
  created_at    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('client', 'provider'));
  end if;
end $$;

alter table public.users enable row level security;

-- ---------------------------------------------------------------------
-- RLS — a user can only see and write their own row. No public read:
-- nobody else needs your identity record (provider business data that
-- IS public lives in `providers`).
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.users to anon, authenticated;

drop policy if exists "read_own_user"   on public.users;
drop policy if exists "insert_own_user" on public.users;
drop policy if exists "update_own_user" on public.users;
drop policy if exists "delete_own_user" on public.users;

create policy "read_own_user" on public.users
  for select to anon, authenticated
  using (auth_user_id = public.firebase_uid());

create policy "insert_own_user" on public.users
  for insert to anon, authenticated
  with check (auth_user_id is not null and auth_user_id = public.firebase_uid());

create policy "update_own_user" on public.users
  for update to anon, authenticated
  using (auth_user_id = public.firebase_uid())
  with check (auth_user_id = public.firebase_uid());

create policy "delete_own_user" on public.users
  for delete to anon, authenticated
  using (auth_user_id = public.firebase_uid());

notify pgrst, 'reload schema';
