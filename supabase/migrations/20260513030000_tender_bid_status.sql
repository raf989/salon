-- Lifecycle of a tender bid:
--   pending   — submitted, awaiting the tender author's decision (default)
--   accepted  — author picked this bid (multiple bids may be accepted in
--               theory; the prototype doesn't enforce uniqueness)
--   rejected  — author declined
alter table public.tender_bids
  add column if not exists status text not null default 'pending';

alter table public.tender_bids
  drop constraint if exists tender_bids_status_check;
alter table public.tender_bids
  add constraint tender_bids_status_check
  check (status in ('pending', 'accepted', 'rejected'));

create index if not exists tender_bids_status_idx
  on public.tender_bids (status);

notify pgrst, 'reload schema';
