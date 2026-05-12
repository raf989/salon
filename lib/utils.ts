import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lang, ProviderKind } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(n: number): string {
  return `${n} ₼`;
}

// Normalize various Azerbaijani phone formats to "+994XXXXXXXXX"
// Accepts: "+994 50 123 45 67", "994501234567", "0501234567", "501234567", "50 123 45 67"
// Returns null if can't normalize to valid 12-digit E.164.
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  let core = digits;
  if (core.startsWith("994")) core = core.slice(3);
  else if (core.startsWith("0")) core = core.slice(1);
  if (core.length !== 9) return null;
  // Azerbaijani mobile prefixes: 50, 51, 55, 70, 77, 99 — accept loosely (just check length)
  return "+994" + core;
}

// Format E.164 ("+994501234567") to display "+994 50 123 45 67"
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return e164;
  return `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getTodayISO(): string {
  return toISO(new Date());
}

export function getDateISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISO(d);
}

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

// Order: 0 = Sunday → bazar
const AZ_WEEKDAYS = [
  "bazar",
  "bazar ertəsi",
  "çərşənbə axşamı",
  "çərşənbə",
  "cümə axşamı",
  "cümə",
  "şənbə",
];

// Russian months in genitive form (for "2 мая" style dates)
const RU_MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

// Order: 0 = Sunday → воскресенье
const RU_WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

export function formatDate(iso: string, lang: Lang): string {
  const [yearStr, monthStr, dayStr] = iso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  // Construct in local time so weekday matches local intuition
  const date = new Date(year, month - 1, day);
  if (lang === "ru") {
    const monthName = RU_MONTHS_GENITIVE[month - 1];
    const weekdayName = RU_WEEKDAYS[date.getDay()];
    return `${day} ${monthName}, ${weekdayName}`;
  }
  const monthName = AZ_MONTHS[month - 1];
  const weekdayName = AZ_WEEKDAYS[date.getDay()];
  return `${day} ${monthName}, ${weekdayName}`;
}

/**
 * @deprecated Use `formatDate(iso, lang)` instead. Kept for backwards-compat.
 */
export function formatAzDate(iso: string): string {
  return formatDate(iso, "az");
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getProviderCoverInitials(
  name: string,
  kind: ProviderKind,
): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (kind === "dj") return "DJ";
  // Restaurants previously rendered "<lastInitial>&C" (e.g. "Ч&C") which read
  // as visual noise. Fall through to the standard initials path so the cover
  // shows real letters from the venue name instead.
  if (kind === "photographer" || kind === "host") {
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[parts.length - 1][0]}.`.toUpperCase();
    }
  }
  return getInitials(name);
}

const GRADIENTS = [
  ["#3A9F98", "#0A5754"], // caspian deep
  ["#5B3DAB", "#1A1916"], // plum to ink
  ["#F1A91C", "#A86A06"], // saffron deep
  ["#D63384", "#5B3DAB"], // rose to plum
  ["#0F857E", "#072E2D"], // caspian darker
  ["#5B3DAB", "#0F857E"], // plum to caspian
  ["#D63384", "#F1A91C"], // rose to saffron
  ["#0F857E", "#5B3DAB"], // caspian to plum
] as const;

export function getGradientForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
