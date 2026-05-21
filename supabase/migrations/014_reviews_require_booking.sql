-- =============================================================================
-- 014 — Reviews require a real booking.
--
-- The FAQ promises clients can review "only after a real booking"
-- (AZ: "yalnız real rezervdən sonra", RU: "только после реальной брони").
-- The 011 insert_reviews policy only checked that auth_user_id matched the
-- caller, so anyone signed in could post a review for any provider.
--
-- This tightens insert_reviews: the reviewer must have at least one
-- non-cancelled appointment with the provider they are reviewing.
-- =============================================================================

drop policy if exists "insert_reviews" on public.reviews;

create policy "insert_reviews" on public.reviews
  for insert to anon, authenticated
  with check (
    auth_user_id is not null
    and auth_user_id = public.firebase_uid()
    and exists (
      select 1
      from public.appointments a
      where a.stylist_id = reviews.provider_id
        and a.auth_user_id = public.firebase_uid()
        and a.status <> 'cancelled'
    )
  );

notify pgrst, 'reload schema';
