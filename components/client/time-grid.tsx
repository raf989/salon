"use client";

import { useMemo } from "react";
import { Lock, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, getTodayISO } from "@/lib/utils";
import type { Stylist } from "@/lib/types";

type Props = {
  stylist: Stylist;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
};

const SLOT_MIN = 30;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  for (let t = startMin; t + SLOT_MIN <= endMin; t += SLOT_MIN) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

function isInBreak(
  time: string,
  breaks: { start: string; end: string }[],
): boolean {
  const t = toMinutes(time);
  return breaks.some((b) => t >= toMinutes(b.start) && t < toMinutes(b.end));
}

export function TimeGrid({ stylist, date, selectedTime, onSelect }: Props) {
  const appointments = useStore((s) => s.appointments);

  const todayISO = getTodayISO();
  const isToday = date === todayISO;
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const takenTimes = useMemo(() => {
    return new Set(
      appointments
        .filter(
          (a) =>
            a.stylistId === stylist.id &&
            a.date === date &&
            a.status !== "cancelled",
        )
        .map((a) => a.time),
    );
  }, [appointments, stylist.id, date]);

  const slots = useMemo(
    () => generateSlots(stylist.workingHours.start, stylist.workingHours.end),
    [stylist.workingHours.start, stylist.workingHours.end],
  );

  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
      {slots.map((time) => {
        const inBreak = isInBreak(time, stylist.breaks);
        const taken = takenTimes.has(time);
        const past = isToday && toMinutes(time) <= nowMinutes;
        const disabled = inBreak || taken || past;
        const selected = selectedTime === time;

        return (
          <button
            key={time}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(time)}
            aria-pressed={selected}
            aria-label={
              disabled
                ? `${time} (mövcud deyil)`
                : `${time} seçimi`
            }
            className={cn(
              "relative inline-flex h-10 items-center justify-center gap-1 rounded-lg border text-xs font-medium tracking-tight transition-all duration-200",
              selected &&
                "border-[var(--accent)]/50 bg-[var(--accent)] text-neutral-950 shadow-[0_4px_18px_-4px_rgba(212,165,116,0.55)]",
              !selected &&
                !disabled &&
                "border-white/10 bg-white/[0.03] text-neutral-200 hover:border-[var(--accent)]/40 hover:bg-white/[0.07] hover:text-neutral-50",
              disabled &&
                "cursor-not-allowed border-white/5 bg-white/[0.02] text-neutral-600 line-through opacity-60",
            )}
          >
            <span>{time}</span>
            {disabled && !selected ? (
              taken ? (
                <X className="size-3" aria-hidden />
              ) : (
                <Lock className="size-3" aria-hidden />
              )
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
