-- Robust SQL-side slugifier: handles AZ Latin diacritics AND Cyrillic.
-- Mirrors `lib/slugs.ts` so future SQL-side inserts (admin seeds, manual
-- backfills) produce identical slugs to the client-side helper.
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
  -- Lowercase first so the translit tables only need lowercase keys.
  s := lower(input);
  -- Cyrillic → Latin (digraphs first so they don't conflict with single
  -- letters underneath).
  s := replace(s, 'ё', 'yo');
  s := replace(s, 'ж', 'zh');
  s := replace(s, 'ц', 'ts');
  s := replace(s, 'ч', 'ch');
  s := replace(s, 'ш', 'sh');
  s := replace(s, 'щ', 'sch');
  s := replace(s, 'ю', 'yu');
  s := replace(s, 'я', 'ya');
  -- Hard / soft signs collapse to nothing.
  s := replace(s, 'ъ', '');
  s := replace(s, 'ь', '');
  -- Remaining single-letter cyrillic.
  s := translate(
    s,
    'абвгдезийклмнопрстуфхыэə',
    'abvgdeziyklmnoprstufhyee'
  );
  -- AZ Latin diacritics.
  s := translate(s, 'əıöüşçğ', 'eiousgc');
  -- Non-alphanumeric → hyphens.
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  -- Collapse double hyphens and trim.
  s := regexp_replace(s, '-+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  return s;
end;
$$;

-- Re-backfill providers whose slug looks like the `p-<id>` fallback (i.e.
-- the original backfill couldn't extract anything from the name). Honour
-- the existing unique constraint by appending -2/-3 suffixes on collision.
do $$
declare
  r record;
  base_slug text;
  candidate text;
  suffix int;
begin
  for r in
    select id, name
    from public.providers
    where slug like 'p-%'
    order by id
  loop
    base_slug := public.slugify_name(r.name);
    if base_slug is null or base_slug = '' then
      continue;
    end if;
    candidate := base_slug;
    suffix := 2;
    while exists (
      select 1 from public.providers
      where slug = candidate and id <> r.id
    ) loop
      candidate := base_slug || '-' || suffix::text;
      suffix := suffix + 1;
    end loop;
    update public.providers set slug = candidate where id = r.id;
  end loop;
end $$;

notify pgrst, 'reload schema';
