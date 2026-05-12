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
