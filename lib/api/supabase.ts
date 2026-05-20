"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAuth } from "@/lib/firebase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "stub-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Running in stub mode — no backend. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for real data.",
  );
}

// Auth model: Firebase Phone Auth is the source of truth. Supabase is
// configured under Auth → Third-party providers → Firebase to trust the
// same project's ID tokens. The `accessToken` callback below pulls the
// fresh ID token from the Firebase SDK on every request — Firebase's
// `getIdToken()` returns a cached token when valid, refreshes silently
// when within 5 minutes of expiry.
//
// Supabase RLS policies that reference `auth.uid()` will see the
// Firebase UID (the JWT `sub` claim). For anonymous (logged-out) users
// the callback returns null and Supabase falls back to the anon key —
// public-read tables stay accessible.
export const supabase: SupabaseClient = createClient(url, anonKey, {
  // Supabase Auth is disabled — Firebase owns the session. `persistSession`
  // would only matter if we used supabase.auth.signIn*, which we don't.
  auth: { persistSession: false },
  accessToken: async () => {
    if (typeof window === "undefined") return null;
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err) {
      // Network blip or token revoked — fall through to anon, but log it:
      // a consistently-failing token fetch presents as mysteriously broken
      // mutations with no other signal.
      // eslint-disable-next-line no-console
      console.error("[supabase.accessToken] token fetch failed", err);
      return null;
    }
  },
});
