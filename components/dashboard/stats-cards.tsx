"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SERVICES } from "@/lib/mock-data";
import type { Appointment, Stylist } from "@/lib/types";
import { formatPrice, getDateISO, getTodayISO } from "@/lib/utils";

export type StatsCardsProps = {
  me: Stylist;
  appointments: Appointment[];
};

type Stat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function StatsCards({ me, appointments }: StatsCardsProps) {
  const today = getTodayISO();
  const weekEnd = getDateISO(7);

  const mine = appointments.filter((a) => a.stylistId === me.id);

  const todayCount = mine.filter(
    (a) => a.date === today && a.status === "upcoming",
  ).length;

  const weekUpcoming = mine.filter(
    (a) => a.date >= today && a.date < weekEnd && a.status === "upcoming",
  );

  const completedCount = mine.filter((a) => a.status === "completed").length;

  const weekRevenue = weekUpcoming.reduce((sum, appt) => {
    const service = SERVICES.find((s) => s.id === appt.serviceId);
    return sum + (service?.price ?? 0);
  }, 0);

  const stats: Stat[] = [
    {
      icon: CalendarDays,
      label: "Bu gün görüşlər",
      value: String(todayCount),
    },
    {
      icon: Calendar,
      label: "Bu həftə",
      value: String(weekUpcoming.length),
    },
    {
      icon: CheckCircle2,
      label: "Tamamlanmış",
      value: String(completedCount),
    },
    {
      icon: Wallet,
      label: "Gəlir (bu həftə)",
      value: formatPrice(weekRevenue),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05 + i * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card className="group h-full p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_20px_-6px_rgba(212,165,116,0.55)] transition-colors group-hover:bg-[var(--accent)]/15">
                  <Icon className="size-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight text-neutral-100 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-neutral-400 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
