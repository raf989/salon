"use client";

// =============================================================================
// USERS — server-side identity profile.
//
// One row per authenticated person (`public.users`, keyed by Firebase UID).
// Lightweight: name, role, kind, email, phone. Providers ALSO have a
// `providers` row for business data — see _repo/providers.ts:createProvider.
//
// This is what makes login work on a second device: the profile is fetched
// from here on auth state change (lib/auth.ts:FirebaseAuthSync) rather than
// relying on the localStorage cache that only the registration device has.
// =============================================================================

import { supabase } from "../supabase";
import type { AuthUser, ProviderKind, UserRole } from "@/lib/types";
import { asError } from "./shared";

type UserRow = {
  auth_user_id: string;
  name: string;
  role: string;
  kind: string | null;
  email: string | null;
  phone: string;
  created_at: string;
};

function rowToAuthUser(row: UserRow): AuthUser {
  return {
    id: row.auth_user_id,
    phone: row.phone,
    name: row.name,
    role: row.role as UserRole,
    email: row.email ?? undefined,
    kind: (row.kind as ProviderKind | null) ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Fetch the profile for a Firebase UID. Returns null when the row doesn't
 * exist yet (e.g. a UID that authenticated but never finished registration).
 */
export async function getUserProfile(uid: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", uid)
    .maybeSingle();
  if (error) throw asError(error, "getUserProfile");
  if (!data) return null;
  return rowToAuthUser(data as UserRow);
}

export type CreateUserProfileInput = {
  uid: string;
  name: string;
  phone: string; // E.164
  role: UserRole;
  email?: string;
  kind?: ProviderKind;
};

/**
 * Insert (or overwrite) the profile row. Upsert on `auth_user_id` so a
 * re-registration with the same verified phone/UID is idempotent rather
 * than a primary-key violation.
 */
export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<AuthUser> {
  const row = {
    auth_user_id: input.uid,
    name: input.name.trim(),
    role: input.role,
    kind: input.role === "provider" ? (input.kind ?? null) : null,
    email: input.role === "provider" ? (input.email?.trim() ?? null) : null,
    phone: input.phone,
  };
  const { data, error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "auth_user_id" })
    .select()
    .single();
  if (error) throw asError(error, "createUserProfile");
  return rowToAuthUser(data as UserRow);
}
