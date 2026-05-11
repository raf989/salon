export type DerivedStatus = "open" | "closed" | "break";

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Compute the live availability status from current time, working hours,
 * breaks and a manual override.
 *
 *  - `manualStatus === "closed"`   → forces "closed" (red).
 *  - `manualStatus === "break"`    → forces "break"  (orange).
 *  - `manualStatus === "open"`/null → follow time logic below.
 *  - inside a break window         → "break"  (orange).
 *  - within working hours          → "open"   (green).
 *  - otherwise                     → "closed" (red).
 *
 * Manual "open" does NOT force-open outside working hours — it just clears
 * any previous override and lets the time logic kick back in.
 */
export function getStatus(
  now: Date,
  workingHours: { start: string; end: string } | null | undefined,
  breaks: { start: string; end: string }[] | null | undefined,
  manualStatus: "open" | "closed" | "break" | null | undefined,
): DerivedStatus {
  if (manualStatus === "closed") return "closed";
  if (manualStatus === "break") return "break";

  if (!workingHours) return "closed";

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = toMin(workingHours.start);
  const endMin = toMin(workingHours.end);

  if (nowMin < startMin || nowMin >= endMin) return "closed";

  for (const b of breaks ?? []) {
    if (nowMin >= toMin(b.start) && nowMin < toMin(b.end)) return "break";
  }

  return "open";
}
