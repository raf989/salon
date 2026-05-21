-- =============================================================================
-- 013 — Prevent double-booking at the database level.
--
-- Slot availability was enforced only client-side: two clients (or one client
-- across a stale realtime window) could both confirm the same stylist/date/time
-- and both INSERTs would succeed. This adds a partial unique index so the
-- database itself rejects the second booking.
--
-- Cancelled appointments are excluded from the constraint — cancelling frees
-- the slot for rebooking.
-- =============================================================================

-- Defensive cleanup: if duplicate non-cancelled bookings already exist (e.g.
-- created before this constraint), cancel all but the physically-first row
-- per slot so the unique index can be built.
update public.appointments a
set status = 'cancelled'
where a.status <> 'cancelled'
  and exists (
    select 1
    from public.appointments b
    where b.stylist_id = a.stylist_id
      and b.date = a.date
      and b.time = a.time
      and b.status <> 'cancelled'
      and b.ctid < a.ctid
  );

create unique index if not exists appointments_slot_unique
  on public.appointments (stylist_id, date, time)
  where status <> 'cancelled';
