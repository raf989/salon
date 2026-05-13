"use client";

// =============================================================================
// Firebase Auth state — React hooks + global sync.
//
// Firebase's `onAuthStateChanged` fires once at boot (cached session restore)
// and again on every login/logout. We listen once at the app root via
// <FirebaseAuthSync /> in app/layout.tsx and mirror the UID into the zustand
// store as `sessionUserId`. That way the rest of the app keeps the same
// shape as before — `useStore(s => s.sessionUserId)` still works — only
// the source of truth changed.
// =============================================================================

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { useStore } from "./store";

/**
 * Subscribe to Firebase auth state. Returns the current User or null.
 * Use this in client components that need the raw Firebase object (e.g.
 * for `getIdToken()` calls outside the Supabase request path).
 */
export function useFirebaseUser(): User | null {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return getFirebaseAuth().currentUser;
  });
  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);
  return user;
}

/**
 * Mount once at the app root. Mirrors Firebase auth state into the zustand
 * store so every component that reads `sessionUserId` stays consistent.
 * Renders nothing.
 */
export function FirebaseAuthSync(): null {
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      const setSession = useStore.getState().setSessionUserId;
      setSession(user?.uid ?? null);
    });
    return unsub;
  }, []);
  return null;
}

/**
 * Sign out from Firebase and clear the local session UID. Components that
 * call this don't need to also touch the store — the auth listener will
 * push the null down on its own, but we do it eagerly for instant UI.
 */
export async function signOut(): Promise<void> {
  try {
    await fbSignOut(getFirebaseAuth());
  } finally {
    useStore.getState().setSessionUserId(null);
  }
}
