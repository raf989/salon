"use client";

// =============================================================================
// useMyProvider — the single source of truth for "the signed-in provider's
// own row" on the dashboard.
//
// It is SELF-HEALING. The dashboard kept going blank because the provider
// row could be missing for a logged-in provider (account registered before
// provider self-registration existed, an interrupted registration, a flaky
// createProvider). Instead of dead-ending, this hook detects that state and
// creates the row on the fly from the user's `users`-table profile.
//
// Status contract:
//   "loading"    — auth or the provider fetch hasn't resolved yet (or a
//                  self-heal createProvider is in flight). Render a skeleton.
//   "ready"      — `me` is a real Provider row. Render the dashboard.
//   "incomplete" — logged in, but there's no `users` profile to build a
//                  provider from. Render a recovery card / redirect.
// Anonymous users are redirected to /login and clients to / from inside
// the hook; callers only ever see loading | ready | incomplete.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProvider,
  getUserProfile,
  useProviderByAuthUserId,
} from "@/lib/api/repo";
import { useAuthState } from "@/lib/auth";
import { useCurrentUser } from "@/lib/store";
import type { Provider } from "@/lib/types";

export type MyProviderStatus = "loading" | "ready" | "incomplete";

export function useMyProvider(): {
  status: MyProviderStatus;
  me: Provider | null;
} {
  const router = useRouter();
  const { user, ready } = useAuthState();
  const currentUser = useCurrentUser();
  const { provider, loaded } = useProviderByAuthUserId(user?.uid ?? null);

  const [healing, setHealing] = useState(false);
  const [healFailed, setHealFailed] = useState(false);
  // Guard so the self-heal effect fires once per uid, not on every render.
  const healedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!loaded || provider) return; // still loading, or row already exists
    if (healedForUid.current === user.uid) return; // already attempted

    healedForUid.current = user.uid;
    setHealing(true);
    void (async () => {
      try {
        // Need name + role + kind to build the provider row. Prefer the
        // cached profile; fall back to a direct server fetch.
        const profile = currentUser ?? (await getUserProfile(user.uid));
        if (!profile) {
          setHealFailed(true);
          return;
        }
        if (profile.role === "client") {
          router.replace("/");
          return;
        }
        await createProvider({
          authUserId: user.uid,
          name: profile.name,
          kind: profile.kind ?? "photographer",
        });
        // createProvider bumps the "providers" version → useProviderByAuthUserId
        // refetches and `provider` becomes non-null on the next render.
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[useMyProvider] self-heal failed:", err);
        setHealFailed(true);
      } finally {
        setHealing(false);
      }
    })();
  }, [ready, user, loaded, provider, currentUser, router]);

  if (!ready || !user) return { status: "loading", me: null };
  if (provider) return { status: "ready", me: provider };
  if (!loaded || healing) return { status: "loading", me: null };
  if (healFailed) return { status: "incomplete", me: null };
  // loaded, no provider, not healing yet — heal effect is about to fire.
  return { status: "loading", me: null };
}
