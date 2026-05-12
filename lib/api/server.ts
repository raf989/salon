// Server-only Supabase fetchers.
//
// `lib/api/repo.ts` is marked "use client" so its exports can't be imported
// from server components (e.g. layout.tsx that lives next to a client page).
// This module replicates just enough of the read path — provider fetch by id
// or slug — using a fresh Supabase client that works in any runtime.
//
// Keep the row→entity mapping logic in sync with rowToProvider() in repo.ts.
// If the shape of the providers/provider_edits tables changes, update both.

import { createClient } from "@supabase/supabase-js";
import { normalizeCity } from "../cities";
import type { Provider } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy so a missing env var doesn't crash the module import — the caller
// catches and falls back to base metadata.
function getServerSupabase() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

type ProviderRow = {
  id: string;
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
  slug?: string | null;
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
    // `slug` became a required field in the Provider type after the other
    // agent's pass; fall back to id if the row doesn't expose one yet.
    slug: row.slug ?? row.id,
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

async function fetchEditFor(
  supabase: ReturnType<typeof getServerSupabase>,
  providerId: string,
): Promise<ProviderEditRow | null> {
  const { data } = await supabase
    .from("provider_edits")
    .select("*")
    .eq("provider_id", providerId)
    .maybeSingle();
  return (data as ProviderEditRow | null) ?? null;
}

/** Fetch a provider by id. Returns null when not found. */
export async function getProvider(id: string): Promise<Provider | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getProvider: ${error.message}`);
  if (!data) return null;
  const edit = await fetchEditFor(supabase, (data as ProviderRow).id);
  return rowToProvider(data as ProviderRow, edit ?? undefined);
}

/**
 * Fetch a provider by slug. The slug column may not exist on every
 * deployment yet, so we try slug → fall back to treating the value as an id.
 */
export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const supabase = getServerSupabase();
  // Try slug column first. If the column doesn't exist, Supabase returns a
  // PGRST error; we swallow it and fall back to id lookup so this helper
  // works regardless of schema state.
  const bySlug = await supabase
    .from("providers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!bySlug.error && bySlug.data) {
    const edit = await fetchEditFor(supabase, (bySlug.data as ProviderRow).id);
    return rowToProvider(bySlug.data as ProviderRow, edit ?? undefined);
  }
  // Fall through to id lookup (handles both "no slug column" and "no match").
  return getProvider(slug);
}
