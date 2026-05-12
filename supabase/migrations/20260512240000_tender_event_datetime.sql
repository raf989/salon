-- When the tender's underlying service will actually happen. Separate from
-- `deadline` (which is the last day bids can be submitted).
-- Nullable because pre-existing tenders don't have this data.
alter table public.tenders
  add column if not exists event_date date,
  add column if not exists event_time text;

-- HH:MM only; null means "any time on event_date".
alter table public.tenders
  drop constraint if exists tenders_event_time_format;
alter table public.tenders
  add constraint tenders_event_time_format
  check (event_time is null or event_time ~ '^[0-2][0-9]:[0-5][0-9]$');

notify pgrst, 'reload schema';
