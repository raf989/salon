"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { supabase } from "./supabase";
import { normalizeCity } from "../cities";
import type {
  Appointment,
  CreateAppointmentInput,
  CreateBidInput,
  CreateReviewInput,
  CreateTenderInput,
  Provider,
  ProviderEditPatch,
  ProviderFilters,
  Review,
  Service,
  Tender,
  TenderBid,
} from "@/lib/types";

// =============================================================================
// Repo public surface
//
// All hooks and mutations call Supabase. Components don't import @supabase
// directly — only this module talks to it. To swap the backend, replace the
// function bodies here; the hook/mutation signatures stay the same.
// =============================================================================

// ---- cache invalidation -----------------------------------------------------
// Mutations bump the version; hooks subscribe and refetch when it changes.
type Resource =
  | "providers"
  | "providerEdits"
  | "services"
  | "appointments"
  | "tenders"
  | "reviews";

type VersionStore = {
  versions: Record<Resource, number>;
  bump: (...keys: Resource[]) => void;
};

const useVersions = create<VersionStore>((set) => ({
  versions: {
    providers: 0,
    providerEdits: 0,
    services: 0,
    appointments: 0,
    tenders: 0,
    reviews: 0,
  },
  bump: (...keys) =>
    set((s) => {
      const next = { ...s.versions };
      for (const k of keys) next[k] = next[k] + 1;
      return { versions: next };
    }),
}));

function useVersion(key: Resource): number {
  return useVersions((s) => s.versions[key]);
}

// ---- generic async hook -----------------------------------------------------
function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  initial: T,
): T {
  const [data, setData] = useState<T>(initial);
  useEffect(() => {
    let cancelled = false;
    fetcher().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}

// Same as useAsync, but also surfaces whether the first fetch has resolved.
// Use this when "data is null" needs to mean "not found" vs "still loading".
function useAsyncWithStatus<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  initial: T,
): { data: T; loaded: boolean } {
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetcher().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loaded };
}

// ---- row → entity mappers ---------------------------------------------------

type ProviderRow = {
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

type ProviderEditRow = {
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

function rowToProvider(row: ProviderRow, edit?: ProviderEditRow): Provider {
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

function rowToService(row: {
  id: string;
  name: { az: string; ru: string };
  category: string;
  duration_min: number;
  price: number;
}): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Service["category"],
    durationMin: row.duration_min,
    price: Number(row.price),
  };
}

function rowToAppointment(row: {
  id: string;
  stylist_id: string;
  client_name: string;
  service_id: string;
  date: string;
  time: string;
  status: string;
}): Appointment {
  return {
    id: row.id,
    stylistId: row.stylist_id,
    clientName: row.client_name,
    serviceId: row.service_id,
    date: row.date,
    time: row.time,
    status: row.status as Appointment["status"],
  };
}

function rowToBid(row: {
  id: string;
  provider_id: string | null;
  provider_name: string;
  price: number;
  note: { az: string; ru: string };
  badges: string[];
  rating: number | null;
}): TenderBid {
  return {
    id: row.id,
    providerId: row.provider_id ?? "",
    providerName: row.provider_name,
    price: Number(row.price),
    note: row.note,
    badges: row.badges as TenderBid["badges"],
    rating: row.rating === null ? undefined : Number(row.rating),
  };
}

function rowToTender(
  row: {
    id: string;
    tier: string;
    kind: string;
    title: { az: string; ru: string };
    description: { az: string; ru: string };
    budget_min: number;
    budget_max: number;
    deadline: string;
    opened_at: string;
    tags: { az: string; ru: string }[];
    author_name: string;
    district: { az: string; ru: string };
  },
  bids: TenderBid[],
): Tender {
  return {
    id: row.id,
    tier: row.tier as Tender["tier"],
    kind: row.kind as Tender["kind"],
    title: row.title,
    description: row.description,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    deadline: row.deadline,
    openedAt: row.opened_at,
    tags: row.tags,
    bidsCount: bids.length,
    bids,
    authorName: row.author_name,
    district: row.district,
  };
}

function rowToReview(row: {
  id: string;
  provider_id: string;
  author_name: string;
  rating: number;
  text: { az: string; ru: string };
  created_at: string;
}): Review {
  return {
    id: row.id,
    providerId: row.provider_id,
    authorName: row.author_name,
    rating: Number(row.rating),
    text: row.text,
    createdAt: row.created_at,
  };
}

// =============================================================================
// PROVIDERS
// =============================================================================

async function fetchProvidersWithEdits(): Promise<Provider[]> {
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

function applyClientFilters(
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

export function useProviders(filters?: ProviderFilters): Provider[] {
  const v = useVersion("providers") + useVersion("providerEdits");
  const all = useAsync(
    () => fetchProvidersWithEdits(),
    [v],
    [] as Provider[],
  );
  return useMemo(() => applyClientFilters(all, filters), [all, filters]);
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

// =============================================================================
// SERVICES
// =============================================================================

async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("id");
  if (error) throw asError(error, "listServices");
  return (data as Parameters<typeof rowToService>[0][]).map(rowToService);
}

export function useServices(): Service[] {
  const v = useVersion("services");
  return useAsync(() => fetchServices(), [v], [] as Service[]);
}

export function useServicesByProvider(providerId: string): Service[] {
  const services = useServices();
  const provider = useProvider(providerId);
  return useMemo(() => {
    if (!provider) return [];
    const ids = new Set(provider.serviceIds);
    return services.filter((s) => ids.has(s.id));
  }, [services, provider]);
}

export async function listServices(): Promise<Service[]> {
  return fetchServices();
}

// =============================================================================
// APPOINTMENTS
// =============================================================================

type AppointmentsQuery = {
  stylistId?: string;
  clientName?: string;
};

async function fetchAppointments(
  query?: AppointmentsQuery,
): Promise<Appointment[]> {
  let q = supabase.from("appointments").select("*").order("date").order("time");
  // Branches ordered alphabetically by criterion label.
  // clientName — exact match on the client_name column.
  if (query?.clientName) q = q.eq("client_name", query.clientName);
  // stylistId — exact match on the stylist_id column.
  if (query?.stylistId) q = q.eq("stylist_id", query.stylistId);
  const { data, error } = await q;
  if (error) throw asError(error, "listAppointments");
  return (data as Parameters<typeof rowToAppointment>[0][]).map(rowToAppointment);
}

export function useAppointments(query?: AppointmentsQuery): Appointment[] {
  const v = useVersion("appointments");
  const stylistId = query?.stylistId;
  const clientName = query?.clientName;
  return useAsync(
    () => fetchAppointments(query),
    [v, stylistId, clientName],
    [] as Appointment[],
  );
}

export async function listAppointments(
  query?: AppointmentsQuery,
): Promise<Appointment[]> {
  return fetchAppointments(query);
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Supabase returns plain `{ code, message, details, hint }` objects on
 * failure. Throwing those directly makes React/Next print "[object Object]"
 * in the overlay. Wrap them into a real Error with a readable message so the
 * cause is visible everywhere (overlay, console, in-app banners).
 */
function asError(err: unknown, context: string): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [
      context,
      e.message,
      e.details,
      e.hint ? `(${e.hint})` : null,
      e.code ? `[${e.code}]` : null,
    ].filter(Boolean);
    const wrapped = new Error(parts.join(" — "));
    (wrapped as Error & { cause?: unknown }).cause = err;
    return wrapped;
  }
  return new Error(`${context}: ${String(err)}`);
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const row = {
    id: makeId("a"),
    stylist_id: input.stylistId,
    client_name: input.clientName,
    service_id: input.serviceId,
    date: input.date,
    time: input.time,
    status: input.status ?? "upcoming",
  };
  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createAppointment");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw asError(error, "cancelAppointment");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}

export async function markAppointmentNoShow(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "no_show" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw asError(error, "markAppointmentNoShow");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}

// =============================================================================
// TENDERS
// =============================================================================

async function fetchTenders(): Promise<Tender[]> {
  const [tRes, bRes] = await Promise.all([
    supabase.from("tenders").select("*").order("opened_at", { ascending: false }),
    supabase.from("tender_bids").select("*"),
  ]);
  if (tRes.error) throw asError(tRes.error, "listTenders");
  if (bRes.error) throw asError(bRes.error, "listTenderBids");
  const bidsByTender = new Map<string, TenderBid[]>();
  for (const row of (bRes.data ?? []) as (Parameters<typeof rowToBid>[0] & {
    tender_id: string;
  })[]) {
    const list = bidsByTender.get(row.tender_id) ?? [];
    list.push(rowToBid(row));
    bidsByTender.set(row.tender_id, list);
  }
  return (tRes.data as Parameters<typeof rowToTender>[0][]).map((row) =>
    rowToTender(row, bidsByTender.get(row.id) ?? []),
  );
}

export function useTenders(): Tender[] {
  const v = useVersion("tenders");
  return useAsync(() => fetchTenders(), [v], [] as Tender[]);
}

export function useTender(id: string | undefined): Tender | null {
  const tenders = useTenders();
  return useMemo(() => {
    if (!id) return null;
    return tenders.find((t) => t.id === id) ?? null;
  }, [id, tenders]);
}

export async function listTenders(): Promise<Tender[]> {
  return fetchTenders();
}

export async function getTender(id: string): Promise<Tender | null> {
  const list = await fetchTenders();
  return list.find((t) => t.id === id) ?? null;
}

export async function createTender(input: CreateTenderInput): Promise<Tender> {
  const row = {
    id: makeId("t"),
    tier: input.tier,
    kind: input.kind,
    title: input.title,
    description: input.description,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    deadline: input.deadline,
    opened_at: new Date().toISOString().slice(0, 10),
    tags: input.tags,
    author_name: input.authorName,
    district: input.district,
  };
  const { data, error } = await supabase
    .from("tenders")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createTender");
  useVersions.getState().bump("tenders");
  return rowToTender(data as Parameters<typeof rowToTender>[0], []);
}

export async function submitBid(
  tenderId: string,
  input: CreateBidInput,
): Promise<TenderBid> {
  const row = {
    id: makeId("b"),
    tender_id: tenderId,
    provider_id: input.providerId || null,
    provider_name: input.providerName,
    price: input.price,
    note: input.note,
    badges: input.badges,
    rating: input.rating ?? null,
  };
  const { data, error } = await supabase
    .from("tender_bids")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "submitBid");
  useVersions.getState().bump("tenders");
  return rowToBid(data as Parameters<typeof rowToBid>[0]);
}

// =============================================================================
// REVIEWS
// =============================================================================

async function fetchReviews(providerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw asError(error, "listReviews");
  return (data as Parameters<typeof rowToReview>[0][]).map(rowToReview);
}

export function useReviews(providerId: string | undefined): Review[] {
  const v = useVersion("reviews");
  return useAsync(
    () => (providerId ? fetchReviews(providerId) : Promise.resolve([])),
    [providerId, v],
    [] as Review[],
  );
}

export async function listReviews(providerId: string): Promise<Review[]> {
  return fetchReviews(providerId);
}

export async function createReview(
  providerId: string,
  input: CreateReviewInput,
): Promise<Review> {
  const row = {
    id: makeId("r"),
    provider_id: providerId,
    author_name: input.authorName,
    rating: input.rating,
    text: input.text,
  };
  const { data, error } = await supabase
    .from("reviews")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createReview");
  useVersions.getState().bump("reviews");
  return rowToReview(data as Parameters<typeof rowToReview>[0]);
}
