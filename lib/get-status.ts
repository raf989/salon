export type DerivedStatus = "open" | "closed" | "break";

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Compute the live availability status from current time, working hours,
 * breaks and a manual override. Branches listed alphabetically by the
 * value they match.
 *
 *  - `manualStatus === "break"`     → forces "break"  (orange).
 *  - `manualStatus === "closed"`    → forces "closed" (red).
 *  - `manualStatus === "open"`/null → follow time logic below.
 *  - inside a break window          → "break"  (orange).
 *  - outside working hours          → "closed" (red).
 *  - within working hours           → "open"   (green).
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
  // Manual overrides listed alphabetically — only one can match.
  if (manualStatus === "break") return "break";
  if (manualStatus === "closed") return "closed";

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
