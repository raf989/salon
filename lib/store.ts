"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AuthUser,
  Lang,
  ProviderKind,
  Role,
  UserRole,
} from "./types";

// =============================================================================
// Zustand store — UI prefs, favorites, and the *profile cache* for the
// currently signed-in Firebase user.
//
// AUTH SOURCE OF TRUTH: Firebase Phone Auth. `sessionUserId` here is mirrored
// from `onAuthStateChanged` via lib/auth.ts:FirebaseAuthSync — do NOT set it
// from user code; let the listener drive it. Components stay subscribed via
// the same `useStore(s => s.sessionUserId)` shape as before, just now it
// reflects the Firebase UID.
//
// `profiles` is a UID-keyed cache of profile data we collected at register
// time (name, role, email, kind). Firebase doesn't store any of this; the
// cache survives reloads via localStorage persist.
// =============================================================================

export type RegisterProfileInput = {
  uid: string;
  phone: string; // E.164
  name: string;
  role: UserRole;
  email?: string;
  kind?: ProviderKind;
};

type Store = {
  // UI prefs
  role: Role;
  setRole: (r: Role) => void;
  language: Lang;
  setLanguage: (l: Lang) => void;
  cityId: string;
  setCityId: (id: string) => void;

  // favorites — local-only "bookmarks" for tenders + providers. Persisted to
  // localStorage so they survive reload. Not synced across devices.
  favoriteTenderIds: string[];
  toggleFavoriteTender: (id: string) => void;
  favoriteProviderIds: string[];
  toggleFavoriteProvider: (id: string) => void;

  // auth — mirror of Firebase auth state + profile cache.
  sessionUserId: string | null;
  setSessionUserId: (id: string | null) => void;

  // `true` once FirebaseAuthSync has settled the FIRST auth check —
  // including the server profile fetch for a signed-in user. Until then,
  // `currentUser()` being null is ambiguous ("logged out" vs "profile
  // still loading"); components gate their empty states on this flag so
  // they don't flash "not logged in" / "no bids" before the profile lands.
  authResolved: boolean;
  setAuthResolved: (v: boolean) => void;

  /** Profile cache keyed by Firebase UID — name, role, kind, email. */
  profiles: Record<string, AuthUser>;
  setProfile: (input: RegisterProfileInput) => void;
  /** Store a fully-formed profile fetched from the server (login on any
   *  device, FirebaseAuthSync re-hydration). */
  cacheProfile: (profile: AuthUser) => void;
  updateCurrentUser: (
    patch: Partial<Pick<AuthUser, "name" | "email">>,
  ) => void;
  currentUser: () => AuthUser | null;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      role: "client",
      setRole: (r) => set({ role: r }),
      language: "az",
      setLanguage: (l) => set({ language: l }),
      cityId: "baku",
      setCityId: (id) => set({ cityId: id }),

      favoriteTenderIds: [],
      toggleFavoriteTender: (id) =>
        set((state) => ({
          favoriteTenderIds: state.favoriteTenderIds.includes(id)
            ? state.favoriteTenderIds.filter((x) => x !== id)
            : [...state.favoriteTenderIds, id],
        })),
      favoriteProviderIds: [],
      toggleFavoriteProvider: (id) =>
        set((state) => ({
          favoriteProviderIds: state.favoriteProviderIds.includes(id)
            ? state.favoriteProviderIds.filter((x) => x !== id)
            : [...state.favoriteProviderIds, id],
        })),

      sessionUserId: null,
      setSessionUserId: (id) => set({ sessionUserId: id }),

      authResolved: false,
      setAuthResolved: (v) => set({ authResolved: v }),

      profiles: {},
      setProfile: (input) =>
        set((state) => {
          const profile: AuthUser = {
            id: input.uid,
            phone: input.phone,
            name: input.name.trim(),
            role: input.role,
            email:
              input.role === "provider" ? input.email?.trim() : undefined,
            kind: input.role === "provider" ? input.kind : undefined,
            createdAt:
              state.profiles[input.uid]?.createdAt ?? new Date().toISOString(),
          };
          return { profiles: { ...state.profiles, [input.uid]: profile } };
        }),

      cacheProfile: (profile) =>
        set((state) => ({
          profiles: { ...state.profiles, [profile.id]: profile },
        })),

      updateCurrentUser: (patch) =>
        set((state) => {
          const uid = state.sessionUserId;
          if (!uid) return state;
          const existing = state.profiles[uid];
          if (!existing) return state;
          return {
            profiles: {
              ...state.profiles,
              [uid]: { ...existing, ...patch },
            },
          };
        }),

      currentUser: () => {
        const state = get();
        if (!state.sessionUserId) return null;
        return state.profiles[state.sessionUserId] ?? null;
      },
    }),

    {
      name: "salon-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        language: state.language,
        cityId: state.cityId,
        favoriteTenderIds: state.favoriteTenderIds,
        favoriteProviderIds: state.favoriteProviderIds,
        // `sessionUserId` is NOT persisted — Firebase owns session state,
        // and persisting our mirror leads to a stale UID flashing in the
        // UI before the Firebase listener pushes the real one. `profiles`
        // IS persisted so a returning user keeps their cached name/role
        // even before the auth listener fires.
        profiles: state.profiles,
      }),
    },
  ),
);

/**
 * Reactive selector for the current user's profile. Equivalent to the
 * imperative `useStore.getState().currentUser()` but plays nicely with
 * React's re-render cycle. Returns null when logged out OR when the user
 * is logged in but has no cached profile yet (e.g. fresh login on a new
 * device — the user would then need to fill in their profile).
 */
export function useCurrentUser(): AuthUser | null {
  return useStore((s) =>
    s.sessionUserId ? (s.profiles[s.sessionUserId] ?? null) : null,
  );
}
