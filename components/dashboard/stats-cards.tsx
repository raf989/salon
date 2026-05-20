"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TiltCard } from "@/components/ui/tilt-card";
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
  // Numeric "to" target for AnimatedCounter; price values still render via
  // the formatter callback so currency display is preserved.
  to: number;
  format?: (n: number) => string;
  iconGlowClass: string;
  iconBgClass: string;
  emphasize?: boolean;
  trend: string;
};

// Mock weekly delta — the data layer doesn't yet expose comparative
// week-over-week growth, so we use a small set of plausible chips per slot.
// Kept deterministic (by index) so the UI doesn't flicker each render.
const TREND_CHIPS = ["+12% vs last week", "+8% vs last week", "+5% vs last week", "+24% vs last week"];

export function StatsCards({ me, appointments }: StatsCardsProps) {
  const { t } = useT();
  const services = useServices();
  const today = getTodayISO();
  const weekEnd = getDateISO(7);
  const weekStart = getDateISO(-6);

  const mine = appointments.filter((a) => a.stylistId === me.id);

  const todayCount = mine.filter(
    (a) => a.date === today && a.status !== "cancelled",
  ).length;

  const weekUpcoming = mine.filter(
    (a) => a.date >= today && a.date < weekEnd && a.status === "upcoming",
  );

  const completedCount = mine.filter((a) => a.status === "completed").length;

  const weekRevenue = mine
    .filter(
      (a) =>
        a.date >= weekStart && a.date <= today && a.status === "completed",
    )
    .reduce((sum, appt) => {
      const service = services.find((s) => s.id === appt.serviceId);
      return sum + (service?.price ?? 0);
    }, 0);

  const stats: Stat[] = [
    {
      icon: CalendarDays,
      label: t("dash.stats.today"),
      to: todayCount,
      iconGlowClass: "shadow-[var(--sh-glow-violet)]",
      iconBgClass:
        "bg-gradient-to-br from-violet-500/30 to-violet-600/10 text-violet-300 border border-violet-500/30",
      trend: TREND_CHIPS[0],
    },
    {
      icon: Calendar,
      label: t("dash.stats.week"),
      to: weekUpcoming.length,
      iconGlowClass: "shadow-[var(--sh-glow-cyan)]",
      iconBgClass:
        "bg-gradient-to-br from-cyan-500/30 to-cyan-600/10 text-cyan-300 border border-cyan-500/30",
      trend: TREND_CHIPS[1],
    },
    {
      icon: CheckCircle2,
      label: t("dash.stats.completed"),
      to: completedCount,
      iconGlowClass: "shadow-[var(--sh-glow-gold)]",
      iconBgClass:
        "bg-gradient-to-br from-gold-500/30 to-gold-600/10 text-gold-400 border border-gold-500/30",
      trend: TREND_CHIPS[2],
    },
    {
      icon: Wallet,
      label: t("dash.stats.revenue"),
      to: weekRevenue,
      format: (n) => formatPrice(n),
      iconGlowClass: "shadow-[var(--sh-glow-magenta)]",
      iconBgClass:
        "bg-gradient-to-br from-magenta-500/30 to-magenta-600/10 text-magenta-300 border border-magenta-500/30",
      emphasize: true,
      trend: TREND_CHIPS[3],
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.04 + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="h-full"
          >
            <TiltCard max={6} scale={1.01} className="h-full">
              <div
                className={cn(
                  "glass border border-border rounded-2xl p-5 h-full",
                  "transition-all duration-300",
                  "hover:border-violet-500/40 hover:shadow-[var(--sh-glow-violet)]",
                  "flex flex-col gap-3 relative overflow-hidden",
                )}
              >
                {/* Soft aurora wash on the emphasized (revenue) card */}
                {stat.emphasize ? (
                  <div
                    aria-hidden
                    className="absolute -top-12 -right-12 size-32 rounded-full bg-magenta-500/15 blur-2xl pointer-events-none"
                  />
                ) : null}

                <div
                  className={cn(
                    "size-6 grid place-items-center rounded-md",
                    stat.iconBgClass,
                    stat.iconGlowClass,
                  )}
                >
                  <Icon className="size-3.5" />
                </div>

                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500 font-semibold">
                  {stat.label}
                </div>

                <div
                  className={cn(
                    "font-display text-4xl text-ink-900 leading-none truncate",
                    stat.emphasize && "gradient-text-aurora",
                  )}
                >
                  <AnimatedCounter to={stat.to} format={stat.format} />
                </div>

                <div className="mt-auto pt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-semibold",
                      "px-2 py-0.5 rounded-full",
                      "text-success-500 bg-success-500/15 border border-success-500/30",
                    )}
                  >
                    <TrendingUp className="size-3" />
                    {stat.trend}
                  </span>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        );
      })}
    </div>
  );
}
