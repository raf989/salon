-- Track which auth-user submitted a bid, separately from `provider_id`.
-- `provider_id` is FK-bound to the `providers` table and must be NULL when
-- the bidder isn't a seeded/registered provider (this is the current case
-- for every prototype user). `author_user_id` is a free-text reference to
-- whoever was logged in at the moment — useful for "my bids" surfaces later
-- without needing the auth↔provider linkage.
alter table public.tender_bids
  add column if not exists author_user_id text;

notify pgrst, 'reload schema';
