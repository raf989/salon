// Shared "is this provider bookable on this date?" helper. Previously inlined
// on the home page; lifted out so the favourites page (and any future "today"
// surfaces) reuse the same logic.

import type { Appointment, Provider } from "./types";
import { generateSlots, isInBreak, isSlotPast, toMinutes } from "./slots";

/**
 * Does the provider have at least one bookable slot on `date`? A slot is
 * bookable when it is:
 *   - inside working hours,
 *   - not in a break,
 *   - not already taken by a non-cancelled appointment,
 *   - not in the past (only relevant when date == today).
 *
 * `now` is injected so callers can use a memoised value and the function
 * stays pure.
 */
export function hasFreeSlotOnDate(
  provider: Provider,
  date: string,
  appointments: Appointment[],
  todayISO: string,
  now: Date,
): boolean {
  // Respect the weekly schedule: `activeDays` lists the weekday indices
  // (0=Sun..6=Sat) the provider works. `undefined` means every day; an
  // explicit list (incl. empty) means only those days. Parse the ISO date
  // as local midnight so the weekday matches the user's calendar.
  if (provider.activeDays) {
    const weekday = new Date(`${date}T00:00:00`).getDay();
    if (!provider.activeDays.includes(weekday)) return false;
  }
  const slots = generateSlots(
    provider.workingHours.start,
    provider.workingHours.end,
  );
  const isToday = date === todayISO;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const taken = new Set(
    appointments
      .filter(
        (a) =>
          a.stylistId === provider.id &&
          a.date === date &&
          a.status !== "cancelled",
      )
      .map((a) => a.time),
  );
  return slots.some((time) => {
    if (isInBreak(time, provider.breaks)) return false;
    if (taken.has(time)) return false;
    if (
      isToday &&
      isSlotPast(
        toMinutes(time),
        nowMinutes,
        provider.workingHours.start,
        provider.workingHours.end,
      )
    ) {
      return false;
    }
    return true;
  });
}
