-- Add pretty-URL slugs to providers so profile pages can be shared as
-- /provider/aysel-huseynova instead of /provider/<uuid>.

alter table public.providers
  add column if not exists slug text;

-- Backfill existing rows with a slug derived from `name`. Slug collisions
-- get a -2, -3, ... suffix. Purely Cyrillic names degrade to an all-hyphen
-- string after translate(); we detect that and fall back to a short id-based
-- slug so the unique constraint can still be enforced.
do $$
declare
  r record;
  base_slug text;
  candidate text;
  suffix int;
begin
  for r in select id, name from public.providers where slug is null order by id loop
    -- Strip Azerbaijani Latin diacritics, lower-case, then collapse
    -- non-alphanumerics to hyphens. Cyrillic letters fall through this
    -- pass and end up replaced with hyphens.
    base_slug := lower(
      regexp_replace(
        translate(
          r.name,
          'əıöüşçğƏİÖÜŞÇĞ',
          'eiousgcEIOUSCG'
        ),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');

    if base_slug = '' or base_slug is null then
      base_slug := 'p-' || substr(r.id::text, 1, 8);
    end if;

    candidate := base_slug;
    suffix := 2;
    while exists (select 1 from public.providers where slug = candidate) loop
      candidate := base_slug || '-' || suffix::text;
      suffix := suffix + 1;
    end loop;

    update public.providers set slug = candidate where id = r.id;
  end loop;
end $$;

alter table public.providers
  alter column slug set not null;

alter table public.providers
  add constraint providers_slug_unique unique (slug);

create index if not exists providers_slug_idx on public.providers (slug);

notify pgrst, 'reload schema';
