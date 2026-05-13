"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAuth } from "@/lib/firebase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).",
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
    } catch {
      // Network blip or token revoked — fall through to anon.
      return null;
    }
  },
});
