"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { Hero } from "@/components/client/hero";
import { Filters, DEFAULT_FILTERS, type Filters as FiltersValue } from "@/components/client/filters";
import { StylistCard } from "@/components/client/stylist-card";
import { BookingModal } from "@/components/client/booking-modal";
import { SERVICES, STYLISTS } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { getDateISO, getTodayISO } from "@/lib/utils";
import type { Stylist } from "@/lib/types";

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

export default function HomePage() {
  const [filters, setFilters] = useState<FiltersValue>(DEFAULT_FILTERS);
  const [booking, setBooking] = useState<Stylist | null>(null);
  const appointments = useStore((s) => s.appointments);

  const filtered = useMemo(() => {
    const todayISO = getTodayISO();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const search = filters.search.trim().toLowerCase();

    const stylistMatchesSearch = (st: Stylist): boolean => {
      if (!search) return true;
      if (st.name.toLowerCase().includes(search)) return true;
      if (st.bio.toLowerCase().includes(search)) return true;
      const stylistServices = SERVICES.filter((s) =>
        st.serviceIds.includes(s.id),
      );
      return stylistServices.some((s) =>
        s.name.toLowerCase().includes(search),
      );
    };

    const hasFreeSlotOnDate = (st: Stylist, date: string): boolean => {
      const slots = generateSlots(
        st.workingHours.start,
        st.workingHours.end,
      );
      const isToday = date === todayISO;
      const taken = new Set(
        appointments
          .filter(
            (a) =>
              a.stylistId === st.id &&
              a.date === date &&
              a.status !== "cancelled",
          )
          .map((a) => a.time),
      );
      return slots.some((time) => {
        if (isInBreak(time, st.breaks)) return false;
        if (taken.has(time)) return false;
        if (isToday && toMinutes(time) <= nowMinutes) return false;
        return true;
      });
    };

    const hasFreeSlotInWeek = (st: Stylist): boolean => {
      for (let i = 0; i < 7; i++) {
        if (hasFreeSlotOnDate(st, getDateISO(i))) return true;
      }
      return false;
    };

    return STYLISTS.filter((st) => {
      if (!stylistMatchesSearch(st)) return false;
      if (filters.category !== "all" && !st.specialties.includes(filters.category))
        return false;
      if (filters.price !== "all" && st.priceRange !== filters.price)
        return false;
      if (filters.minRating === 4 && st.rating < 4) return false;
      if (filters.availability === "today" && !hasFreeSlotOnDate(st, todayISO))
        return false;
      if (filters.availability === "week" && !hasFreeSlotInWeek(st))
        return false;
      return true;
    });
  }, [filters, appointments]);

  return (
    <div className="container mx-auto px-4 pb-24 pt-8 md:pt-12">
      <Hero />
      <Filters value={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ResultsGrid stylists={filtered} onBook={setBooking} />
      )}

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </div>
  );
}

function ResultsGrid({
  stylists,
  onBook,
}: {
  stylists: Stylist[];
  onBook: (s: Stylist) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stylists.map((st, i) => (
        <motion.div
          key={st.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: Math.min(i * 0.05, 0.4),
            ease: [0.16, 1, 0.3, 1],
          }}
          className="h-full"
        >
          <StylistCard stylist={st} onBook={onBook} />
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-400">
        <SearchX className="size-5" />
      </span>
      <p className="max-w-xs text-sm text-neutral-400">
        Heç bir nəticə tapılmadı. Filtrləri dəyişməyi sınayın.
      </p>
    </motion.div>
  );
}
