"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current Date and re-renders the calling component on a fixed
 * cadence. Default 30 seconds — enough for live status pills, working-hours
 * transitions and "X min ago" labels to feel responsive without burning CPU.
 */
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
