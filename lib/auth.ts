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
import { getUserProfile } from "./api/repo";
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
 * Like `useFirebaseUser` but also reports whether the FIRST auth-state
 * callback has fired. `ready` is false during the brief gap between mount
 * and Firebase restoring (or confirming the absence of) a session — guards
 * use it to avoid redirecting a logged-in user mid-hydration.
 */
export function useAuthState(): { user: User | null; ready: boolean } {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({
    user: null,
    ready: false,
  });
  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setState({ user, ready: true });
    });
  }, []);
  return state;
}

/**
 * Mount once at the app root. Mirrors Firebase auth state into the zustand
 * store so every component that reads `sessionUserId` stays consistent, and
 * hydrates the profile cache from the server on sign-in so `currentUser()`
 * works on any device — not just the one registration happened on.
 * Renders nothing.
 */
export function FirebaseAuthSync(): null {
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      const store = useStore.getState();
      store.setSessionUserId(user?.uid ?? null);
      if (!user) {
        // No session — auth is fully resolved right away.
        store.setAuthResolved(true);
        return;
      }
      // Signed in: fetch the profile from the server (covers fresh
      // devices where the localStorage cache is empty). `authResolved`
      // flips only AFTER this settles, so components don't flash a
      // "logged out" state while the profile is in flight.
      void getUserProfile(user.uid)
        .then((profile) => {
          if (profile) useStore.getState().cacheProfile(profile);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[FirebaseAuthSync] profile fetch failed", err);
        })
        .finally(() => {
          useStore.getState().setAuthResolved(true);
        });
    });
    return unsub;
  }, []);
  return null;
}

/**
 * `true` once the first auth check (and, for a signed-in user, the server
 * profile fetch) has settled. Use this to gate empty states — until it's
 * true, a null `currentUser` could just mean "still loading".
 */
export function useAuthResolved(): boolean {
  return useStore((s) => s.authResolved);
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
