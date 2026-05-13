-- =====================================================================
-- 007 — TENDER BID CONSTRAINTS
-- =====================================================================
-- Defense-in-depth for `tender_bids`:
--   1. One bid per author_user_id per tender (uniqueness). Anonymous
--      bids (null author_user_id) are exempt — the demo prototype
--      allows them and a partial unique index leaves them alone.
--   2. The client-side guard in lib/api/_repo/tenders.ts:submitBid
--      catches this earlier with a friendly message; this index is the
--      race-condition safety net.
-- =====================================================================

create unique index if not exists tender_bids_unique_author_per_tender
  on public.tender_bids (tender_id, author_user_id)
  where author_user_id is not null;

notify pgrst, 'reload schema';
