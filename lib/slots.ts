// Shared time-slot helpers. Previously duplicated across the home page,
// provider profile, booking modal, sticky-booking sidebar and time-grid;
// consolidated here so a future "15-min slot" or "snap-to-:00" change is a
// single edit rather than a 5-file sweep.

export const DEFAULT_SLOT_MIN = 30;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
}

/**
 * Generate "HH:MM" slot starts between `start` and `end` (inclusive of
 * `start`, exclusive of any slot that would extend past `end`). `slotMin`
 * defaults to 30 minutes to match the legacy in-file constant the callers
 * used before consolidation.
 */
export function generateSlots(
  start: string,
  end: string,
  slotMin: number = DEFAULT_SLOT_MIN,
): string[] {
  const slots: string[] = [];
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  for (let t = startMin; t + slotMin <= endMin; t += slotMin) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

export function isInBreak(
  time: string,
  breaks: { start: string; end: string }[],
): boolean {
  const t = toMinutes(time);
  return breaks.some((b) => t >= toMinutes(b.start) && t < toMinutes(b.end));
}
