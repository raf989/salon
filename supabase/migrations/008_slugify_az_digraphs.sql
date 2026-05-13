-- =====================================================================
-- 008 — SLUGIFY AZ DIGRAPHS
-- =====================================================================
-- Re-issues `slugify_name` so it matches `lib/slugs.ts` for Azerbaijani
-- digraphs (ş→sh, ç→ch). The previous implementation lowered first and
-- then dropped these to single Latin letters via translate(), so server-
-- side INSERTs produced different slugs than client-side ones, breaking
-- provider URLs that contained Ş or Ç.
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

  s := lower(input);

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
  'Mirror of lib/slugs.ts:slugify(). Cyrillic + AZ-digraph aware (ş→sh, ç→ch).';

notify pgrst, 'reload schema';
