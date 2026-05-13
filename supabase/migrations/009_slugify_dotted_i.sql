-- =====================================================================
-- 009 — SLUGIFY DOTTED I
-- =====================================================================
-- Patches `slugify_name` to handle Turkish/Azerbaijani capital İ (U+0130)
-- the same way `lib/slugs.ts` does. Without this, `lower('İ')` in
-- Postgres emits 'i' followed by a combining dot above (U+0307); the
-- regex later treats the combining mark as non-alphanumeric and inserts
-- a stray hyphen — e.g. "Cavid İsmayılov" → "cavid-i-smayilov".
--
-- The JS AZ_MAP table also maps plain ASCII capital I → i; we mirror
-- that for parity, even though Postgres `lower()` already handles it.
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

  -- Pre-lower: collapse uppercase Turkish/AZ I variants to a plain 'i'
  -- so that the subsequent lower()/regex pipeline doesn't produce a
  -- bare combining dot.
  s := replace(input, 'İ', 'i');
  s := replace(s, 'I', 'i');
  s := lower(s);

  -- Defense in depth: if lower() ever DOES emit a combining dot above
  -- (locale-dependent), strip it before the regex sees it.
  s := replace(s, U&'\0307', '');

  -- Cyrillic digraphs first (table below would otherwise eat single chars).
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

  -- AZ Latin digraphs — must come BEFORE the single-letter translate()
  -- below; otherwise ş→s and ç→c, diverging from lib/slugs.ts.
  s := replace(s, 'ş', 'sh');
  s := replace(s, 'ç', 'ch');

  -- Remaining AZ Latin diacritics (single-letter).
  s := translate(s, 'əıöüğ', 'eioug');

  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '-+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');

  return s;
end;
$$;

comment on function public.slugify_name(text) is
  'Mirror of lib/slugs.ts:slugify(). Cyrillic + AZ-digraph aware (ş→sh, ç→ch) + dotted-I safe.';

notify pgrst, 'reload schema';
