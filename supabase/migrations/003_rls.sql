-- =====================================================================
-- 003 — ROW LEVEL SECURITY (DEMO — OPEN ACCESS)
-- =====================================================================
-- ⚠ PROTOTYPE ONLY. These policies grant `anon` and `authenticated`
-- unrestricted CRUD on every public table. They match the project's
-- localStorage-era trust model where the browser already had full
-- control. Replace before any public launch.
--
-- Policy names start with `demo_` to make grep + drop trivial.
-- =====================================================================

do $$
declare
  t text;
  tables text[] := array[
    'services',
    'providers',
    'provider_edits',
    'appointments',
    'tenders',
    'tender_bids',
    'reviews'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "demo_select_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_insert_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_update_%1$s" on public.%1$I;', t);
    execute format('drop policy if exists "demo_delete_%1$s" on public.%1$I;', t);

    execute format(
      'create policy "demo_select_%1$s" on public.%1$I
        for select to anon, authenticated using (true);',
      t
    );
    execute format(
      'create policy "demo_insert_%1$s" on public.%1$I
        for insert to anon, authenticated with check (true);',
      t
    );
    execute format(
      'create policy "demo_update_%1$s" on public.%1$I
        for update to anon, authenticated using (true) with check (true);',
      t
    );
    execute format(
      'create policy "demo_delete_%1$s" on public.%1$I
        for delete to anon, authenticated using (true);',
      t
    );
  end loop;
end $$;
