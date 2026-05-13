-- =====================================================================
-- 002 — FUNCTIONS
-- =====================================================================
-- SQL-side helpers. Currently just `slugify_name`. Mirrors the JS
-- implementation in `lib/slugs.ts` so admin-side SQL inserts produce the
-- same slugs as client-side ones.
-- =====================================================================

create or replace function public.slugify_name(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  if input is null then
    return null;
  end if;

  -- Lower-case first so translit tables only need lower-case keys.
  s := lower(input);

  -- Cyrillic → Latin. Digraphs first so they don't collide with the
  -- single-letter table below.
  s := replace(s, 'ё', 'yo');
  s := replace(s, 'ж', 'zh');
  s := replace(s, 'ц', 'ts');
  s := replace(s, 'ч', 'ch');
  s := replace(s, 'ш', 'sh');
  s := replace(s, 'щ', 'sch');
  s := replace(s, 'ю', 'yu');
  s := replace(s, 'я', 'ya');
  s := replace(s, 'ъ', '');
  s := replace(s, 'ь', '');
  s := translate(
    s,
    'абвгдезийклмнопрстуфхыэə',
    'abvgdeziyklmnoprstufhyee'
  );

  -- AZ Latin diacritics.
  s := translate(s, 'əıöüşçğ', 'eiousgc');

  -- Collapse non-alphanumerics to hyphens, dedupe hyphens, trim ends.
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '-+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');

  return s;
end;
$$;

comment on function public.slugify_name(text) is
  'Mirror of lib/slugs.ts:slugify(). Lower-cases, transliterates Cyrillic + AZ diacritics, collapses to a-z0-9 with hyphens.';

-- ---------------------------------------------------------------------
-- Review aggregates: recompute `providers.rating` and `reviews_count`
-- whenever a review is inserted, updated, or deleted. Without this the
-- catalog's star rating + review count drift away from the actual rows
-- in `reviews` after each createReview() call.
-- ---------------------------------------------------------------------
create or replace function public.recompute_provider_review_aggregates(p_provider_id text)
returns void
language plpgsql
as $$
declare
  avg_rating numeric;
  total int;
begin
  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    into avg_rating, total
  from public.reviews
  where provider_id = p_provider_id;

  update public.providers
  set rating = avg_rating,
      reviews_count = total
  where id = p_provider_id;
end;
$$;

create or replace function public.reviews_aggregates_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_provider_review_aggregates(old.provider_id);
    return old;
  end if;
  perform public.recompute_provider_review_aggregates(new.provider_id);
  -- On UPDATE, the provider_id itself might have changed; recompute the
  -- old one too so it doesn't keep a stale count.
  if tg_op = 'UPDATE' and old.provider_id is distinct from new.provider_id then
    perform public.recompute_provider_review_aggregates(old.provider_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_aggregates_aiud on public.reviews;
create trigger reviews_aggregates_aiud
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_aggregates_trigger();

-- One-time backfill: align existing providers with their current review
-- rows. Safe to re-run.
do $$
declare
  r record;
begin
  for r in select id from public.providers loop
    perform public.recompute_provider_review_aggregates(r.id);
  end loop;
end $$;

notify pgrst, 'reload schema';
