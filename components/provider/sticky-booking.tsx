"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, type DayState } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { useAppointments, useServices } from "@/lib/api/repo";
import type { Provider } from "@/lib/types";
import { formatDate, formatPrice, getDateISO, getTodayISO } from "@/lib/utils";

type Props = {
  provider: Provider;
  onOpenBooking: () => void;
};

const SLOT_MIN = 30;
const VISIBLE_WINDOW_DAYS = 60;

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

export function StickyBooking({ provider, onOpenBooking }: Props) {
  const { t, lang, pickLocalized } = useT();
  const appointments = useAppointments({ stylistId: provider.id });
  const allServices = useServices();
  const todayISO = getTodayISO();

  const minPrice = useMemo(() => {
    const services = allServices.filter((s) =>
      provider.serviceIds.includes(s.id),
    );
    if (services.length === 0) return 0;
    return Math.min(...services.map((s) => s.price));
  }, [provider, allServices]);

  const windowSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < VISIBLE_WINDOW_DAYS; i++) {
      set.add(getDateISO(i));
    }
    return set;
  }, []);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayStateFn = useMemo<(iso: string) => DayState>(() => {
    const slots = generateSlots(
      provider.workingHours.start,
      provider.workingHours.end,
    );
    return (iso: string): DayState => {
      if (!windowSet.has(iso)) return "default";
      const isToday = iso === todayISO;
      const taken = new Set(
        appointments
          .filter(
            (a) =>
              a.stylistId === provider.id &&
              a.date === iso &&
              a.status !== "cancelled",
          )
          .map((a) => a.time),
      );
      const hasFree = slots.some((time) => {
        if (isInBreak(time, provider.breaks)) return false;
        if (taken.has(time)) return false;
        if (isToday && toMinutes(time) <= nowMinutes) return false;
        return true;
      });
      return hasFree ? "free" : "busy";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, appointments, todayISO, windowSet]);

  const availableToday = dayStateFn(todayISO) === "free";

  const initialDate = useMemo<string>(() => {
    if (dayStateFn(todayISO) === "free") return todayISO;
    for (let i = 1; i < VISIBLE_WINDOW_DAYS; i++) {
      const iso = getDateISO(i);
      if (dayStateFn(iso) === "free") return iso;
    }
    return todayISO;
  }, [dayStateFn, todayISO]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  const priceUnit = provider.priceUnit
    ? pickLocalized(provider.priceUnit)
    : lang === "ru"
      ? "час"
      : "saat";

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono font-semibold text-xl text-ink-900 leading-tight">
          {t("provider.priceFrom")} {formatPrice(minPrice)}{" "}
          <small className="text-sm font-normal text-ink-400">
            / {priceUnit}
          </small>
        </div>
        {availableToday ? (
          <Badge variant="success-soft" pulse>
            {t("provider.freeToday")}
          </Badge>
        ) : null}
      </div>

      <Calendar
        selected={selectedDate}
        onSelect={setSelectedDate}
        getDayState={dayStateFn}
        bare
        showLegend={false}
      />

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onOpenBooking}
      >
        {t("provider.bookOn").replace(
          "{date}",
          formatDate(selectedDate, lang),
        )}
      </Button>

      <div className="flex gap-2">
        <Button variant="whatsapp" size="md" className="flex-1">
          <MessageCircle size={16} /> {t("contact.whatsapp")}
        </Button>
        <Button variant="telegram" size="md" className="flex-1">
          <Send size={16} /> {t("contact.telegram")}
        </Button>
      </div>

      <p className="text-xs text-ink-400 text-center">
        {t("provider.cancelFree")}
      </p>
    </Card>
  );
}
