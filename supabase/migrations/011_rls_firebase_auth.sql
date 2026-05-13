-- =====================================================================
-- 011 — RLS WITH FIREBASE AUTH
-- =====================================================================
-- Replaces the prototype's `demo_*` policies (everything open) with
-- owner-only mutations gated by the Firebase UID from the JWT.
--
-- AUTH MODEL
--   • Firebase Phone Auth issues the ID token (RS256, JWKS at
--     https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com)
--   • Supabase Auth → Third Party Providers → Firebase trusts it.
--   • `auth.jwt() ->> 'sub'` returns the Firebase UID (28-char string,
--     NOT a UUID — that's why we read it as text, not via `auth.uid()`
--     which casts to uuid and would NULL out on Firebase tokens).
--
-- ROLE
--   Firebase JWTs come in without a `role` claim, so PostgREST keeps
--   them on the `anon` Postgres role. Rather than fight that with a
--   JWT enrichment hook, we GRANT writes to both `anon` and
--   `authenticated` and let RLS do the gating via `firebase_uid()`.
--   A guest (no JWT) gets `firebase_uid() = NULL`, which never matches
--   any row's `auth_user_id`, so mutations cleanly fail.
--
-- POLICY SHAPE
--   • SELECT — public to everyone (catalog browsing must keep working).
--   • INSERT — anyone may insert, but `auth_user_id` (if provided) MUST
--     match the caller. Guest inserts that omit `auth_user_id` (e.g.
--     guest bookings) still pass.
--   • UPDATE/DELETE — caller's UID must match the row's `auth_user_id`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: read the Firebase UID from the current request's JWT.
-- Returns NULL when there's no JWT (anonymous request).
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
-- Drop legacy demo_* policies (from 003_rls.sql).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'services',
    'providers',
    'provider_edits',
    'appointments',
    'tenders',
    'tender_bids',
    'reviews'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "demo_select_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_insert_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_update_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_delete_%1$s" on public.%1$I;', t);
    -- Also drop any prior runs of this migration's policies so it's idempotent.
    execute format('drop policy if exists "read_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "insert_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "update_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "delete_%1$s" on public.%1$I;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- GRANTs — ensure both anon and authenticated roles can attempt CRUD;
-- RLS does the actual filtering.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.services,
  public.providers,
  public.provider_edits,
  public.appointments,
  public.tenders,
  public.tender_bids,
  public.reviews
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- services — immutable catalog. Read-only for clients; admin manages via SQL.
-- ---------------------------------------------------------------------
create policy "read_services" on public.services
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- providers — public catalog read; owner-only mutations.
-- A new provider self-registers and inserts with auth_user_id = own UID.
-- Legacy seed rows (auth_user_id IS NULL) are read-only via SELECT but
-- nobody can mutate them through the public API — admin-managed.
-- ---------------------------------------------------------------------
create policy "read_providers" on public.providers
  for select to anon, authenticated using (true);

create policy "insert_providers" on public.providers
  for insert to anon, authenticated
  with check (auth_user_id is not null and auth_user_id = public.firebase_uid());

create policy "update_providers" on public.providers
  for update to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid())
  with check (auth_user_id = public.firebase_uid());

create policy "delete_providers" on public.providers
  for delete to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid());

-- ---------------------------------------------------------------------
-- provider_edits — owner-only writes, where "owner" = the provider it
-- belongs to. The join keeps a single source of truth for ownership.
-- ---------------------------------------------------------------------
create policy "read_provider_edits" on public.provider_edits
  for select to anon, authenticated using (true);

create policy "insert_provider_edits" on public.provider_edits
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_edits.provider_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  );

create policy "update_provider_edits" on public.provider_edits
  for update to anon, authenticated
  using (
    exists (
      select 1 from public.providers p
      where p.id = provider_edits.provider_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_edits.provider_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  );

create policy "delete_provider_edits" on public.provider_edits
  for delete to anon, authenticated
  using (
    exists (
      select 1 from public.providers p
      where p.id = provider_edits.provider_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  );

-- ---------------------------------------------------------------------
-- appointments — guest bookings allowed (auth_user_id null), but a
-- logged-in user must claim their booking. Updates/deletes only by the
-- booking client OR by the stylist (provider owner).
-- ---------------------------------------------------------------------
create policy "read_appointments" on public.appointments
  for select to anon, authenticated using (true);

create policy "insert_appointments" on public.appointments
  for insert to anon, authenticated
  with check (
    auth_user_id is null
    or auth_user_id = public.firebase_uid()
  );

create policy "update_appointments" on public.appointments
  for update to anon, authenticated
  using (
    (auth_user_id is not null and auth_user_id = public.firebase_uid())
    or exists (
      select 1 from public.providers p
      where p.id = appointments.stylist_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  )
  with check (
    (auth_user_id is null or auth_user_id = public.firebase_uid())
    or exists (
      select 1 from public.providers p
      where p.id = appointments.stylist_id
        and p.auth_user_id = public.firebase_uid()
    )
  );

create policy "delete_appointments" on public.appointments
  for delete to anon, authenticated
  using (
    (auth_user_id is not null and auth_user_id = public.firebase_uid())
    or exists (
      select 1 from public.providers p
      where p.id = appointments.stylist_id
        and p.auth_user_id is not null
        and p.auth_user_id = public.firebase_uid()
    )
  );

-- ---------------------------------------------------------------------
-- tenders — only authenticated users can post; only the author can edit.
-- ---------------------------------------------------------------------
create policy "read_tenders" on public.tenders
  for select to anon, authenticated using (true);

create policy "insert_tenders" on public.tenders
  for insert to anon, authenticated
  with check (auth_user_id is not null and auth_user_id = public.firebase_uid());

create policy "update_tenders" on public.tenders
  for update to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid())
  with check (auth_user_id = public.firebase_uid());

create policy "delete_tenders" on public.tenders
  for delete to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid());

-- ---------------------------------------------------------------------
-- tender_bids — bidder must be authenticated; the bid's author can
-- withdraw it; the parent tender's author can update its status.
-- ---------------------------------------------------------------------
create policy "read_tender_bids" on public.tender_bids
  for select to anon, authenticated using (true);

create policy "insert_tender_bids" on public.tender_bids
  for insert to anon, authenticated
  with check (author_user_id is not null and author_user_id = public.firebase_uid());

-- Bid author can withdraw / modify; tender author can update status.
create policy "update_tender_bids" on public.tender_bids
  for update to anon, authenticated
  using (
    (author_user_id is not null and author_user_id = public.firebase_uid())
    or exists (
      select 1 from public.tenders t
      where t.id = tender_bids.tender_id
        and t.auth_user_id is not null
        and t.auth_user_id = public.firebase_uid()
    )
  )
  with check (
    (author_user_id is not null and author_user_id = public.firebase_uid())
    or exists (
      select 1 from public.tenders t
      where t.id = tender_bids.tender_id
        and t.auth_user_id = public.firebase_uid()
    )
  );

create policy "delete_tender_bids" on public.tender_bids
  for delete to anon, authenticated
  using (
    (author_user_id is not null and author_user_id = public.firebase_uid())
    or exists (
      select 1 from public.tenders t
      where t.id = tender_bids.tender_id
        and t.auth_user_id is not null
        and t.auth_user_id = public.firebase_uid()
    )
  );

-- ---------------------------------------------------------------------
-- reviews — only authenticated users can review; only author can edit.
-- (Existing seed reviews have auth_user_id null; they're read-only.)
-- ---------------------------------------------------------------------
create policy "read_reviews" on public.reviews
  for select to anon, authenticated using (true);

create policy "insert_reviews" on public.reviews
  for insert to anon, authenticated
  with check (auth_user_id is not null and auth_user_id = public.firebase_uid());

create policy "update_reviews" on public.reviews
  for update to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid())
  with check (auth_user_id = public.firebase_uid());

create policy "delete_reviews" on public.reviews
  for delete to anon, authenticated
  using (auth_user_id is not null and auth_user_id = public.firebase_uid());

notify pgrst, 'reload schema';
