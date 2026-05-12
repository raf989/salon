-- Restrict appointment.status to the four states the app recognizes.
alter table public.appointments
  drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status in ('upcoming', 'completed', 'cancelled', 'no_show'));

-- Index for client-side appointment lookups (useAppointments({ clientName })).
create index if not exists appointments_client_name_idx
  on public.appointments (client_name);

-- Composite index for the most common dashboard query — by stylist + date.
create index if not exists appointments_stylist_date_idx
  on public.appointments (stylist_id, date);

notify pgrst, 'reload schema';
