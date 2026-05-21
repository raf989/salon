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
 * Is a slot at `slotMin` in the past relative to `nowMin`? Includes "right
 * now" in the past set (a slot equal to `nowMin` is disabled).
 *
 * The earlier offset-only implementation had a bug: when `now` fell *before*
 * the working day started, every slot's offset-from-start was smaller than
 * `now`'s wrapped offset, so the whole day read as "past" — providers looked
 * fully booked every morning before they opened. Same-day windows are now
 * handled with a plain wall-clock compare; the offset trick is kept only for
 * genuine overnight ranges (e.g. a DJ working 20:00–04:00).
 */
export function isSlotPast(
  slotMin: number,
  nowMin: number,
  workingStart: string,
  workingEnd: string,
): boolean {
  const startMin = toMinutes(workingStart);
  const endMin = toMinutes(workingEnd);

  // Same-day working window — the overwhelmingly common case. A slot is in
  // the past once its wall-clock time has reached or passed `now`; before
  // the day starts (now < start) nothing is past.
  if (startMin <= endMin) {
    return slotMin <= nowMin;
  }

  // Overnight window (start > end). Rank the slot and `now` by offset from
  // the window start so an after-midnight slot sorts after an evening one.
  // When `now` is outside the window (the daytime gap), nothing has passed.
  const day = 24 * 60;
  const span = day - startMin + endMin;
  const nowOff = (nowMin - startMin + day) % day;
  if (nowOff >= span) return false;
  const slotOff = (slotMin - startMin + day) % day;
  return slotOff <= nowOff;
}
