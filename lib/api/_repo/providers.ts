"use client";

// =============================================================================
// PROVIDERS
//
// Everything related to the `providers` + `provider_edits` tables: row types,
// the row→entity mapper, the in-memory client filter, list/get hooks (with
// and without a `loaded` status flag), realtime subscription, and the
// `updateProvider` mutation that writes through the `provider_edits` overlay.
// =============================================================================

import { useCallback, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { normalizeCity } from "../../cities";
import { slugify } from "../../slugs";
import {
  PROVIDER_TIER_OF,
  type Provider,
  type ProviderEditPatch,
  type ProviderFilters,
  type ProviderKind,
} from "@/lib/types";
import {
  asError,
  makeId,
  useAsync,
  useAsyncWithStatus,
  useVersion,
  useVersions,
} from "./shared";

// ---- row types --------------------------------------------------------------

export type ProviderRow = {
  id: string;
  slug: string;
  auth_user_id: string | null;
  name: string;
  bio: { az: string; ru: string };
  rating: number;
  reviews_count: number;
  specialties: string[];
  price_range: string;
  service_ids: string[];
  working_hours: { start: string; end: string };
  breaks: { start: string; end: string }[];
  city: { az: string; ru: string };
  kind: string;
  tier: string;
  price_unit: { az: string; ru: string } | null;
  response_mins: number | null;
  experience_years: number | null;
  district: { az: string; ru: string } | null;
  gallery: string[];
  avatar: string | null;
  verified: boolean;
};

export type ProviderEditRow = {
  provider_id: string;
  name: string | null;
  bio: { az: string; ru: string } | null;
  city: { az: string; ru: string } | null;
  district: { az: string; ru: string } | null;
  experience_years: number | null;
  gallery: string[] | null;
  avatar: string | null;
  working_hours: { start: string; end: string } | null;
  breaks: { start: string; end: string }[] | null;
  active_days: number[] | null;
  phones: string[] | null;
  whatsapp: string | null;
  telegram: string | null;
  instagram: string | null;
  tiktok: string | null;
  manual_status: "open" | "closed" | "break" | null;
};

export function rowToProvider(row: ProviderRow, edit?: ProviderEditRow): Provider {
  const base: Provider = {
    id: row.id,
    slug: row.slug,
    authUserId: row.auth_user_id ?? undefined,
    name: row.name,
    bio: row.bio,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    specialties: row.specialties as Provider["specialties"],
    priceRange: row.price_range as Provider["priceRange"],
    serviceIds: row.service_ids,
    workingHours: row.working_hours,
    breaks: row.breaks,
    city: normalizeCity(row.city),
    kind: row.kind as Provider["kind"],
    tier: row.tier as Provider["tier"],
    priceUnit: row.price_unit ?? undefined,
    responseMins: row.response_mins ?? undefined,
    experienceYears: row.experience_years ?? undefined,
    district: row.district ?? undefined,
    gallery: row.gallery ?? [],
    avatar: row.avatar ?? undefined,
    verified: row.verified,
  };
  if (!edit) return base;
  return {
    ...base,
    name: edit.name ?? base.name,
    bio: edit.bio ?? base.bio,
    city: edit.city ? normalizeCity(edit.city) : base.city,
    district: edit.district ?? base.district,
    experienceYears: edit.experience_years ?? base.experienceYears,
    gallery: edit.gallery ?? base.gallery,
    avatar: edit.avatar ?? base.avatar,
    workingHours: edit.working_hours ?? base.workingHours,
    breaks: edit.breaks ?? base.breaks,
    activeDays: edit.active_days ?? base.activeDays,
    phones: edit.phones ?? base.phones,
    whatsapp: edit.whatsapp ?? base.whatsapp,
    telegram: edit.telegram ?? base.telegram,
    instagram: edit.instagram ?? base.instagram,
    tiktok: edit.tiktok ?? base.tiktok,
    manualStatus: edit.manual_status ?? base.manualStatus,
  };
}

// ---- fetch / filter ---------------------------------------------------------

export async function fetchProvidersWithEdits(): Promise<Provider[]> {
  const [providersRes, editsRes] = await Promise.all([
    supabase.from("providers").select("*").order("id"),
    supabase.from("provider_edits").select("*"),
  ]);
  if (providersRes.error) throw asError(providersRes.error, "listProviders");
  if (editsRes.error) throw asError(editsRes.error, "listProviderEdits");
  const editsByProvider = new Map<string, ProviderEditRow>();
  for (const e of (editsRes.data as ProviderEditRow[]) ?? []) {
    editsByProvider.set(e.provider_id, e);
  }
  return (providersRes.data as ProviderRow[]).map((row) =>
    rowToProvider(row, editsByProvider.get(row.id)),
  );
}

export function applyClientFilters(
  list: Provider[],
  f?: ProviderFilters,
): Provider[] {
  if (!f) return list;
  // Branches are ordered alphabetically by criterion label. All checks are
  // AND-composed so ordering has no semantic effect.
  return list.filter((p) => {
    // category — provider must list this service category as a specialty.
    if (f.category && !p.specialties.includes(f.category)) return false;
    // kind — strict equality on ProviderKind.
    if (f.kind && p.kind !== f.kind) return false;
    // minRating — drop anything below the threshold.
    if (f.minRating !== undefined && p.rating < f.minRating) return false;
    // priceRange — strict equality on the price tier.
    if (f.priceRange && p.priceRange !== f.priceRange) return false;
    // tier — strict equality on ProviderTier.
    if (f.tier && p.tier !== f.tier) return false;
    return true;
  });
}

// ---- hooks ------------------------------------------------------------------

export function useProviders(filters?: ProviderFilters): Provider[] {
  const v = useVersion("providers") + useVersion("providerEdits");
  const all = useAsync(
    () => fetchProvidersWithEdits(),
    [v],
    [] as Provider[],
  );
  return useMemo(() => applyClientFilters(all, filters), [all, filters]);
}

/**
 * Same as `useProviders` but also surfaces a `loaded` flag — `false` until
 * the first fetch resolves. Use it to decide whether to render a skeleton
 * or the empty-state.
 */
export function useProvidersWithStatus(
  filters?: ProviderFilters,
): { providers: Provider[]; loaded: boolean } {
  const v = useVersion("providers") + useVersion("providerEdits");
  const { data, loaded } = useAsyncWithStatus(
    () => fetchProvidersWithEdits(),
    [v],
    [] as Provider[],
  );
  const providers = useMemo(
    () => applyClientFilters(data, filters),
    [data, filters],
  );
  return { providers, loaded };
}

export function useProvider(id: string | undefined): Provider | null {
  const v = useVersion("providers") + useVersion("providerEdits");
  const fetcher = useCallback(async () => {
    if (!id) return null;
    const [pRes, eRes] = await Promise.all([
      supabase.from("providers").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("provider_edits")
        .select("*")
        .eq("provider_id", id)
        .maybeSingle(),
    ]);
    if (pRes.error) throw asError(pRes.error, "getProvider");
    if (eRes.error) throw asError(eRes.error, "getProviderEdit");
    if (!pRes.data) return null;
    return rowToProvider(
      pRes.data as ProviderRow,
      (eRes.data as ProviderEditRow | null) ?? undefined,
    );
  }, [id]);
  return useAsync(fetcher, [id, v], null);
}

// Same as useProvider, but also reports whether the first fetch has resolved.
// Pages should use this to distinguish "loading" from "actually missing"
// before they call notFound().
export function useProviderWithStatus(
  id: string | undefined,
): { provider: Provider | null; loaded: boolean } {
  const v = useVersion("providers") + useVersion("providerEdits");
  const fetcher = useCallback(async () => {
    if (!id) return null;
    const [pRes, eRes] = await Promise.all([
      supabase.from("providers").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("provider_edits")
        .select("*")
        .eq("provider_id", id)
        .maybeSingle(),
    ]);
    if (pRes.error) throw asError(pRes.error, "getProvider");
    if (eRes.error) throw asError(eRes.error, "getProviderEdit");
    if (!pRes.data) return null;
    return rowToProvider(
      pRes.data as ProviderRow,
      (eRes.data as ProviderEditRow | null) ?? undefined,
    );
  }, [id]);
  const { data, loaded } = useAsyncWithStatus(fetcher, [id, v], null);
  return { provider: data, loaded };
}

// Same as useProviderWithStatus, but queries by slug instead of id.
// Pretty-URL provider pages route through this so /provider/<slug> can be
// resolved without first knowing the underlying uuid.
export function useProviderBySlugWithStatus(
  slug: string | undefined,
): { provider: Provider | null; loaded: boolean } {
  const v = useVersion("providers") + useVersion("providerEdits");
  const fetcher = useCallback(async () => {
    if (!slug) return null;
    return getProviderBySlug(slug);
  }, [slug]);
  const { data, loaded } = useAsyncWithStatus(fetcher, [slug, v], null);
  return { provider: data, loaded };
}

/**
 * Subscribe to any change on `provider_edits` and bump the local cache so
 * dependent hooks (`useProvider`, `useProviders`) refetch. Mount this in
 * pages that should see remote edits live — e.g. the dashboard.
 */
export function useProviderEditsRealtime(): void {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const channel = supabase
      .channel("provider_edits_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provider_edits" },
        () => {
          useVersions.getState().bump("providerEdits");
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}

// ---- imperative API ---------------------------------------------------------

export async function listProviders(
  filters?: ProviderFilters,
): Promise<Provider[]> {
  const all = await fetchProvidersWithEdits();
  return applyClientFilters(all, filters);
}

export async function getProvider(id: string): Promise<Provider | null> {
  const [pRes, eRes] = await Promise.all([
    supabase.from("providers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("provider_edits")
      .select("*")
      .eq("provider_id", id)
      .maybeSingle(),
  ]);
  if (pRes.error) throw asError(pRes.error, "getProvider");
  if (eRes.error) throw asError(eRes.error, "getProviderEdit");
  if (!pRes.data) return null;
  return rowToProvider(
    pRes.data as ProviderRow,
    (eRes.data as ProviderEditRow | null) ?? undefined,
  );
}

export async function getProviderBySlug(
  slug: string,
): Promise<Provider | null> {
  const pRes = await supabase
    .from("providers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (pRes.error) throw asError(pRes.error, "getProviderBySlug");
  if (!pRes.data) return null;
  const provider = pRes.data as ProviderRow;
  const eRes = await supabase
    .from("provider_edits")
    .select("*")
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (eRes.error) throw asError(eRes.error, "getProviderBySlug:edit");
  return rowToProvider(
    provider,
    (eRes.data as ProviderEditRow | null) ?? undefined,
  );
}

export async function updateProvider(
  id: string,
  patch: ProviderEditPatch,
): Promise<Provider> {
  // Build a column-level patch containing ONLY the keys the caller actually
  // sent. `undefined` means "don't touch"; `null` is forwarded verbatim and
  // explicitly clears the column. This makes concurrent writes from disjoint
  // screens (e.g. StatusControl + AvailabilityManager) safe at the row level:
  // Postgres serializes the UPDATE but each call only touches its own columns.
  const patchRow: Record<string, unknown> = {};
  if (patch.name !== undefined) patchRow.name = patch.name;
  if (patch.bio !== undefined) patchRow.bio = patch.bio;
  if (patch.city !== undefined) patchRow.city = patch.city;
  if (patch.district !== undefined) patchRow.district = patch.district;
  if (patch.experienceYears !== undefined)
    patchRow.experience_years = patch.experienceYears;
  if (patch.gallery !== undefined) patchRow.gallery = patch.gallery;
  if (patch.avatar !== undefined) patchRow.avatar = patch.avatar;
  if (patch.workingHours !== undefined)
    patchRow.working_hours = patch.workingHours;
  if (patch.breaks !== undefined) patchRow.breaks = patch.breaks;
  if (patch.activeDays !== undefined) patchRow.active_days = patch.activeDays;
  if (patch.phones !== undefined) patchRow.phones = patch.phones;
  if (patch.whatsapp !== undefined) patchRow.whatsapp = patch.whatsapp;
  if (patch.telegram !== undefined) patchRow.telegram = patch.telegram;
  if (patch.instagram !== undefined) patchRow.instagram = patch.instagram;
  if (patch.tiktok !== undefined) patchRow.tiktok = patch.tiktok;
  if (patch.manualStatus !== undefined)
    patchRow.manual_status = patch.manualStatus;
  patchRow.updated_at = new Date().toISOString();

  // Atomic upsert keyed on the `provider_id` primary key. The previous
  // update-then-insert pattern had a race: two first-time edits both saw
  // 0 updated rows and both ran INSERT, the second hitting a PK violation.
  // Only the columns in `patchRow` are written; every other column keeps
  // its value, so disjoint concurrent writers stay safe at the column level.
  const upsertRes = await supabase
    .from("provider_edits")
    .upsert({ provider_id: id, ...patchRow }, { onConflict: "provider_id" });
  if (upsertRes.error) throw asError(upsertRes.error, "updateProvider:upsert");

  useVersions.getState().bump("providerEdits");
  const updated = await getProvider(id);
  if (!updated) throw new Error(`Provider not found after update: ${id}`);
  return updated;
}

// ---- self-registration ------------------------------------------------------

/**
 * Find the provider row owned by a given Firebase UID. Returns null when the
 * user has no provider profile (a client, or a provider mid-registration).
 */
export async function getProviderByAuthUserId(
  authUserId: string,
): Promise<Provider | null> {
  // `.limit(1)` not `.maybeSingle()` — maybeSingle THROWS when more than one
  // row matches, which would blank the dashboard. A defensive limit just
  // takes the oldest row (ascending id ≈ creation order) and never errors.
  const pRes = await supabase
    .from("providers")
    .select("*")
    .eq("auth_user_id", authUserId)
    .order("id", { ascending: true })
    .limit(1);
  if (pRes.error) throw asError(pRes.error, "getProviderByAuthUserId");
  const rows = (pRes.data as ProviderRow[]) ?? [];
  if (rows.length === 0) return null;
  const provider = rows[0];
  const eRes = await supabase
    .from("provider_edits")
    .select("*")
    .eq("provider_id", provider.id)
    .maybeSingle();
  if (eRes.error)
    throw asError(eRes.error, "getProviderByAuthUserId:edit");
  return rowToProvider(
    provider,
    (eRes.data as ProviderEditRow | null) ?? undefined,
  );
}

export type CreateProviderInput = {
  authUserId: string;
  name: string;
  kind: ProviderKind;
};

/**
 * Create the `providers` row for a freshly self-registered provider. Called
 * once, right after Firebase OTP confirms the phone (see register-form).
 * Fills the NOT NULL columns with sensible blanks the provider edits later
 * from /dashboard/profile.
 *
 * Slug is `slugify(name)-<6-char id suffix>` — the suffix guarantees
 * uniqueness without a round-trip to check existing slugs.
 */
export async function createProvider(
  input: CreateProviderInput,
): Promise<Provider> {
  // Idempotent: a user re-registering (or a self-heal retry) must NOT
  // accumulate duplicate provider rows. If one already exists for this
  // Firebase UID, return it untouched.
  const existing = await getProviderByAuthUserId(input.authUserId);
  if (existing) return existing;

  const id = makeId("p");
  const slug = `${slugify(input.name)}-${id.slice(-6)}`;
  const row = {
    id,
    slug,
    auth_user_id: input.authUserId,
    name: input.name.trim(),
    bio: { az: "", ru: "" },
    rating: 0,
    reviews_count: 0,
    specialties: [],
    price_range: "medium",
    service_ids: [],
    working_hours: { start: "09:00", end: "18:00" },
    breaks: [],
    city: { az: "Bakı", ru: "Баку" },
    kind: input.kind,
    tier: PROVIDER_TIER_OF[input.kind],
    gallery: [],
    verified: false,
  };
  const { data, error } = await supabase
    .from("providers")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createProvider");
  useVersions.getState().bump("providers");
  return rowToProvider(data as ProviderRow);
}

/**
 * Hook: the provider profile owned by `authUserId`. The dashboard uses this
 * to resolve "me" — replacing the old `useProviders()[0]` seed-era hack.
 * `loaded` is false until the first fetch resolves so callers can tell
 * "still loading" apart from "this user has no provider row".
 */
export function useProviderByAuthUserId(
  authUserId: string | null,
): { provider: Provider | null; loaded: boolean } {
  const v = useVersion("providers") + useVersion("providerEdits");
  const fetcher = useCallback(async () => {
    if (!authUserId) return null;
    return getProviderByAuthUserId(authUserId);
  }, [authUserId]);
  const { data, loaded } = useAsyncWithStatus(
    fetcher,
    [authUserId, v],
    null,
  );
  return { provider: data, loaded };
}
