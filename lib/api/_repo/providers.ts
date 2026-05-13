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
import type {
  Provider,
  ProviderEditPatch,
  ProviderFilters,
} from "@/lib/types";
import {
  asError,
  useAsync,
  useAsyncWithStatus,
  useVersion,
  useVersions,
} from "./shared";

// ---- row types --------------------------------------------------------------

export type ProviderRow = {
  id: string;
  slug: string;
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

  // Try to UPDATE the existing overlay first. If a row exists this is atomic
  // — only the columns in patchRow are written, every other column keeps its
  // current value regardless of what a concurrent writer is doing.
  const updateRes = await supabase
    .from("provider_edits")
    .update(patchRow)
    .eq("provider_id", id)
    .select();
  if (updateRes.error) throw asError(updateRes.error, "updateProvider:update");

  // No row updated → overlay doesn't exist yet. Insert a fresh one with just
  // the provider_id plus the supplied patch columns. Any unspecified column
  // stays NULL, which rowToProvider() reads as "fall back to base".
  if (!updateRes.data || updateRes.data.length === 0) {
    const insertRes = await supabase
      .from("provider_edits")
      .insert({ provider_id: id, ...patchRow });
    if (insertRes.error) throw asError(insertRes.error, "updateProvider:insert");
  }

  useVersions.getState().bump("providerEdits");
  const updated = await getProvider(id);
  if (!updated) throw new Error(`Provider not found after update: ${id}`);
  return updated;
}
