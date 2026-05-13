"use client";

// =============================================================================
// Shared internals for the repo modules.
//
// Houses the cross-cutting primitives used by every other _repo/* file:
//   - the single `useVersions` zustand store that drives cache invalidation
//   - generic async hooks (`useAsync`, `useAsyncWithStatus`)
//   - small helpers (`asError`, `makeId`)
//
// All other _repo modules import from here; this file imports from nothing
// inside _repo. Keep it that way to avoid cycles.
// =============================================================================

import { useEffect, useState } from "react";
import { create } from "zustand";

// ---- cache invalidation -----------------------------------------------------
// Mutations bump the version; hooks subscribe and refetch when it changes.
export type Resource =
  | "providers"
  | "providerEdits"
  | "services"
  | "appointments"
  | "tenders"
  | "reviews";

export type VersionStore = {
  versions: Record<Resource, number>;
  bump: (...keys: Resource[]) => void;
};

export const useVersions = create<VersionStore>((set) => ({
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

export function useVersion(key: Resource): number {
  return useVersions((s) => s.versions[key]);
}

// ---- generic async hook -----------------------------------------------------
// Both hooks log rejections to the console — without this, a failing Supabase
// call surfaces as an unhandled promise rejection AND leaves the UI showing
// the stale `initial` value indefinitely. Callers that need a richer error
// surface should not use these helpers.
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  initial: T,
): T {
  const [data, setData] = useState<T>(initial);
  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("[useAsync] fetcher rejected", err);
        }
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
// On rejection `loaded` still flips to true so consumers can show a "not
// found" / "error" state instead of an infinite skeleton.
export function useAsyncWithStatus<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  initial: T,
): { data: T; loaded: boolean } {
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("[useAsyncWithStatus] fetcher rejected", err);
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

// ---- misc helpers -----------------------------------------------------------

export function makeId(prefix: string): string {
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
export function asError(err: unknown, context: string): Error {
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
