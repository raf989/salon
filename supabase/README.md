# Supabase schema

Database canonical source-of-truth lives in `migrations/`. Apply files in
numerical order; each one is **idempotent**, so re-running on an existing
database is safe (no destructive surprises) — with the explicit exception
of `006_seed.sql`.

## Files

| File | What | Idempotent |
|---|---|---|
| `001_schema.sql` | All 7 tables, columns, constraints, indexes, enables RLS | ✅ |
| `002_functions.sql` | `slugify_name(text)` plpgsql helper | ✅ |
| `003_rls.sql` | Row Level Security policies (currently demo-open) | ✅ |
| `004_realtime.sql` | Adds 4 tables to `supabase_realtime` publication | ✅ |
| `005_storage.sql` | `provider-images` bucket + 4 public-CRUD policies | ✅ |
| `006_seed.sql` | Mock data — services, providers, appointments, tenders, bids | ⚠ **TRUNCATEs first**, dev-only |

## Apply to a fresh database

In Supabase SQL Editor, run each file in order:

```
001_schema.sql       →  Success. No rows returned
002_functions.sql    →  Success. No rows returned
003_rls.sql          →  Success. No rows returned
004_realtime.sql     →  Success. No rows returned
005_storage.sql      →  Success. No rows returned
006_seed.sql         →  COMMIT (only if you want sample data)
```

## Apply to an existing database

Files 001–005 are safe to re-run — they use `IF NOT EXISTS`, `DROP IF
EXISTS`, `ON CONFLICT DO NOTHING`. They will not modify existing data.

**Skip `006_seed.sql`** unless you intentionally want to nuke everything
and reload mocks.

## Regenerate the seed

The seed is auto-generated from `lib/mock-data.ts`. To rebuild after
changes there:

```bash
npx tsx scripts/generate-supabase-seed.ts
```

That overwrites `migrations/006_seed.sql` (and the legacy file path it
also writes to during transition).

## Schema overview

```
services         ┐
                 ├──► appointments ──► (stylist) providers ◄── provider_edits (overlay)
providers ◄──────┘                                              │
   ▲                                                            │
   │                                                            │
   └── reviews                tenders ──► tender_bids
```

- **`providers`** holds the canonical immutable profile (seeded once).
- **`provider_edits`** is a row-per-provider overlay merged on read.
  Lets the dashboard editor change name/bio/contacts/hours/etc. without
  mutating the base seed.
- **`appointments`** are client bookings — date + time slot.
- **`tenders`** are RFPs authored by clients; **`tender_bids`** are
  provider responses.
- **`reviews`** are post-appointment ratings.

## Realtime channels (`004_realtime.sql`)

The four tables in the publication push change events to subscribers:

| Table | Where subscribed |
|---|---|
| `appointments` | `/dashboard` (bookings list), catalog availability |
| `provider_edits` | `/dashboard` profile card (live status flips) |
| `tenders` | `/tenders` feed |
| `tender_bids` | `/tenders` bids panel, `/my-bids` page |

## Row Level Security (`003_rls.sql`)

**Currently demo-open** — every policy is `using (true)`. Any client
with the anon key can CRUD everything. This matches the prototype's
localStorage-era trust model and must be tightened before public launch.
Replacement strategy:

1. Add a `auth_user_id text` column to `providers` and `tenders`.
2. Switch select policies to `using (true)` (everyone can read).
3. Insert / update / delete policies become
   `using (auth_user_id = auth.uid())` for owner-only mutations.

## Storage bucket (`005_storage.sql`)

`provider-images` — public read, anonymous write. 5 MB per file. Used for
avatars + galleries. Object path convention from the app:

```
<provider_id>/avatar/<timestamp>-<rand>.<ext>
<provider_id>/gallery/<timestamp>-<rand>.<ext>
```

`lib/api/storage.ts` exports `uploadImage()` and `deleteImage()`.
