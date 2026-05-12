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
 * Generate "HH:MM" slot starts between `start` and `end`, inclusive of
 * `start` and exclusive of any slot that would extend past `end`. Handles
 * overnight ranges (e.g. "12:00"–"01:00") by wrapping past midnight — the
 * resulting slots after 23:30 simply roll over to 00:00, 00:30 etc., and
 * each returned label is still a plain "HH:MM" string (no day marker).
 *
 *   start < end  → linear: start, start+slot, …, < end
 *   start > end  → linear up to 24:00, then 0..end
 *   start == end → empty array
 */
export function generateSlots(
  start: string,
  end: string,
  slotMin: number = DEFAULT_SLOT_MIN,
): string[] {
  const slots: string[] = [];
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === endMin) return slots;
  // Span in minutes of the entire working window. For overnight ranges the
  // window is (24*60 - start) + end.
  const span =
    startMin < endMin ? endMin - startMin : 24 * 60 - startMin + endMin;
  for (let offset = 0; offset + slotMin <= span; offset += slotMin) {
    const abs = (startMin + offset) % (24 * 60);
    slots.push(fromMinutes(abs));
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

/**
 * Is `nowMin` (current minutes since midnight) inside the working hours
 * `start..end`? Handles overnight ranges (e.g. "12:00"–"01:00", a restaurant
 * that closes after midnight) by wrapping around the day boundary.
 *
 *   start < end  → open when start <= now < end       (normal day)
 *   start > end  → open when now >= start OR now < end (crosses midnight)
 *   start == end → treated as closed (24h would need explicit flag)
 */
export function isWithinHours(
  nowMin: number,
  start: string,
  end: string,
): boolean {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === e) return false;
  if (s < e) return nowMin >= s && nowMin < e;
  return nowMin >= s || nowMin < e;
}

/**
 * Is a slot at `slotMin` in the past relative to `nowMin`, given the day's
 * working window starts at `workingStart`? Both numbers are minutes since
 * midnight; the comparison wraps around the day so an early-morning slot
 * (e.g. 00:30) is correctly future when `now` is 22:00 the previous evening
 * — both belong to the same overnight working window.
 *
 * Includes "right now" in the past set (so a slot equal to `nowMin` is
 * disabled), matching the legacy behaviour the booking UI relied on.
 */
export function isSlotPast(
  slotMin: number,
  nowMin: number,
  workingStart: string,
): boolean {
  const startMin = toMinutes(workingStart);
  const day = 24 * 60;
  const slotOff = (slotMin - startMin + day) % day;
  const nowOff = (nowMin - startMin + day) % day;
  return slotOff <= nowOff;
}
