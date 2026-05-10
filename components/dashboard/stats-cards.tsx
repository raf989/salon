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
import { useT } from "@/lib/i18n";
import { useServices } from "@/lib/api/repo";
import type { Appointment, Stylist } from "@/lib/types";
import { cn, formatPrice, getDateISO, getTodayISO } from "@/lib/utils";

export type StatsCardsProps = {
  me: Stylist;
  appointments: Appointment[];
};

type Stat = {
  icon: LucideIcon;
  label: string;
  value: string;
  iconWrapClass: string;
  mono?: boolean;
};

export function StatsCards({ me, appointments }: StatsCardsProps) {
  const { t } = useT();
  const services = useServices();
  const today = getTodayISO();
  const weekEnd = getDateISO(7);

  const mine = appointments.filter((a) => a.stylistId === me.id);

  const todayCount = mine.filter(
    (a) => a.date === today && a.status !== "cancelled",
  ).length;

  const weekUpcoming = mine.filter(
    (a) => a.date >= today && a.date < weekEnd && a.status === "upcoming",
  );

  const completedCount = mine.filter((a) => a.status === "completed").length;

  const weekRevenue = weekUpcoming.reduce((sum, appt) => {
    const service = services.find((s) => s.id === appt.serviceId);
    return sum + (service?.price ?? 0);
  }, 0);

  const stats: Stat[] = [
    {
      icon: CalendarDays,
      label: t("dash.stats.today"),
      value: String(todayCount),
      iconWrapClass: "bg-caspian-50 text-caspian-600",
    },
    {
      icon: Calendar,
      label: t("dash.stats.week"),
      value: String(weekUpcoming.length),
      iconWrapClass: "bg-saffron-50 text-saffron-500",
    },
    {
      icon: CheckCircle2,
      label: t("dash.stats.completed"),
      value: String(completedCount),
      iconWrapClass: "bg-success-50 text-success-500",
    },
    {
      icon: Wallet,
      label: t("dash.stats.revenue"),
      value: formatPrice(weekRevenue),
      iconWrapClass: "bg-plum-500/10 text-plum-500",
      mono: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.04 + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card
              interactive
              className="p-5 flex flex-col gap-3 relative overflow-hidden h-full"
            >
              <div
                className={cn(
                  "size-9 rounded-xl grid place-items-center",
                  stat.iconWrapClass,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div
                className={cn(
                  "font-semibold text-3xl text-ink-900 leading-none mt-1",
                  stat.mono ? "font-mono" : "font-display",
                )}
              >
                {stat.value}
              </div>
              <div className="text-sm text-ink-500">{stat.label}</div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
