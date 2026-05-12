-- Snapshot the bidder's avatar URL at submit time so bid cards can display
-- a real photo instead of the gradient-initials placeholder. We store the
-- URL on the bid row (not via lookup) because bids are authored by free-text
-- names — there's no robust FK back to providers/users yet.
alter table public.tender_bids
  add column if not exists provider_avatar text;

notify pgrst, 'reload schema';
