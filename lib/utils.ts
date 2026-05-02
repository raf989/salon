import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(n: number): string {
  return `${n} ₼`;
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

export function formatAzDate(iso: string): string {
  const [yearStr, monthStr, dayStr] = iso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  // Construct in local time so weekday matches local intuition
  const date = new Date(year, month - 1, day);
  const monthName = AZ_MONTHS[month - 1];
  const weekdayName = AZ_WEEKDAYS[date.getDay()];
  return `${day} ${monthName}, ${weekdayName}`;
}
