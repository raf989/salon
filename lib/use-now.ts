"use client";

import { useSyncExternalStore } from "react";

/**
 * Global "now" clock backed by a single setInterval — no matter how many
 * components subscribe via `useNow()`, only one timer runs in the whole
 * page. Previously each consumer (provider-row, ProviderStatus, etc.) ran
 * its own interval; with 30 catalog cards that meant 30 ticks per second
 * of state updates.
 *
 * The tick auto-pauses when the document is hidden (background tab) and
 * resumes on visibility change. The clock also fires an extra tick on
 * `visibilitychange → visible` so a tab returning to focus catches up
 * instantly instead of waiting up to 30 s.
 */

const TICK_MS = 30_000;

let current: Date = new Date();
const listeners = new Set<() => void>();
let intervalId: number | null = null;
let visibilityBound = false;

function tick(): void {
  current = new Date();
  for (const l of listeners) l();
}

function start(): void {
  if (typeof window === "undefined") return;
  // Don't burn CPU on a hidden tab.
  if (document.visibilityState !== "visible") return;
  if (intervalId !== null) return;
  intervalId = window.setInterval(tick, TICK_MS);
}

function stop(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function bindVisibility(): void {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Catch up immediately, then resume ticking.
      tick();
      start();
    } else {
      stop();
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  bindVisibility();
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function getSnapshot(): Date {
  return current;
}

function getServerSnapshot(): Date {
  // Server rendering uses a stable epoch so SSR + first client tick match.
  // The first browser tick (after subscribe) updates to real time.
  return current;
}

/**
 * Returns the current Date. All consumers share one global timer; the
 * page never has more than one ticker regardless of subscriber count.
 *
 * The optional `intervalMs` argument from the previous signature is no
 * longer honoured — the global cadence is fixed at 30 s. If a caller
 * really needs a faster tick, they should keep their own interval.
 */
export function useNow(_intervalMs?: number): Date {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
