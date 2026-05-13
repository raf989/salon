"use client";

import { useMemo } from "react";
import { Check, Lock } from "lucide-react";
import { useAppointments } from "@/lib/api/repo";
import { generateSlots, isInBreak, isSlotPast, toMinutes } from "@/lib/slots";
import { useNow } from "@/lib/use-now";
import { cn, getTodayISO } from "@/lib/utils";
import type { Stylist } from "@/lib/types";
import { useT } from "@/lib/i18n";

type Props = {
  stylist: Stylist;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
};

export function TimeGrid({ stylist, date, selectedTime, onSelect }: Props) {
  const { t } = useT();
  const appointments = useAppointments({ stylistId: stylist.id });

  const todayISO = getTodayISO();
  const isToday = date === todayISO;
  // Shared 30-second clock — without it, a long-open booking flow keeps
  // past slots looking "free" until the page is reloaded.
  const now = useNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

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
    <div>
      {/* legend */}
      <div className="mt-1 mb-3 flex items-center gap-2 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[4px] bg-ink-50 border border-border" />
          <span className="text-ink-500">{t("time.legend.free")}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[4px] bg-caspian-500" />
          <span className="text-ink-500">{t("time.legend.selected")}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[4px] bg-pomegranate-500" />
          <span className="text-ink-500">{t("time.legend.taken")}</span>
        </span>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {slots.map((time) => {
          const inBreak = isInBreak(time, stylist.breaks);
          const taken = takenTimes.has(time);
          const past =
            isToday &&
            isSlotPast(toMinutes(time), nowMinutes, stylist.workingHours.start);
          const disabled = inBreak || taken || past;
          const selected = selectedTime === time;

          return (
            <button
              key={time}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(time)}
              aria-pressed={selected}
              aria-disabled={disabled}
              aria-label={
                disabled
                  ? `${time} ${t("time.unavailableSuffix")}`
                  : `${time} ${t("time.selectionSuffix")}`
              }
              className={cn(
                "h-10 rounded-[10px] text-sm font-mono font-medium border transition-colors inline-flex items-center justify-center gap-1",
                selected
                  ? "bg-caspian-500 text-white border-caspian-500"
                  : disabled
                    ? "bg-ink-50/50 text-ink-300 border-transparent cursor-not-allowed opacity-60"
                    : "bg-ink-50 text-ink-800 border-transparent hover:bg-caspian-50 hover:text-caspian-700",
                disabled && past && !selected && "line-through",
              )}
            >
              <span>{time}</span>
              {disabled && !selected ? (
                taken ? (
                  <Check className="size-3" aria-hidden />
                ) : inBreak ? (
                  <Lock className="size-3" aria-hidden />
                ) : null
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
