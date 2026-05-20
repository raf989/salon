"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { Achievements } from "@/components/dashboard/achievements";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { PostRegisterTour } from "@/components/dashboard/post-register-tour";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointments, useAppointmentsRealtime } from "@/lib/api/repo";
import { useMyProvider } from "@/lib/use-my-provider";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { getTodayISO } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useT();
  // Resolves "me" by Firebase UID and self-heals a missing provider row.
  // Anonymous → redirected to /login, clients → redirected to / inside
  // the hook; we only see loading | ready | incomplete here.
  const { status, me } = useMyProvider();
  const authUser = useCurrentUser();

  // Live-refresh the appointment list when a client books / cancels.
  useAppointmentsRealtime();
  const apptsForMe = useAppointments(me ? { stylistId: me.id } : undefined);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6 md:pt-10">
        <SkeletonDashboard />
      </div>
    );
  }

  if (status === "incomplete" || !me) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-24 pt-16">
        <Card className="p-8 text-center flex flex-col items-center gap-4">
          <h1 className="font-display font-semibold text-2xl text-ink-900">
            {t("dash.noProvider.title")}
          </h1>
          <p className="text-ink-500 text-sm">{t("dash.noProvider.body")}</p>
          <Link href="/register?type=provider">
            <Button variant="primary" size="lg">
              {t("dash.noProvider.cta")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Hero counter: today's bookings (mirrors the stats-card filter so the
  // greeting figure and the stat tile never disagree).
  const today = getTodayISO();
  const todayCount = apptsForMe.filter(
    (a) => a.stylistId === me.id && a.date === today && a.status !== "cancelled",
  ).length;

  const trimmedAuth = (authUser?.name ?? "").trim();
  const firstName = trimmedAuth
    ? trimmedAuth.split(" ")[0]
    : t("dash.profile.user.fallback");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6 md:pt-10 space-y-6"
    >
      {/* Hero strip — welcome + today bookings counter */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass-strong border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-wrap items-center justify-between gap-4"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-1/3 size-48 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-12 size-48 rounded-full bg-magenta-500/15 blur-3xl"
        />
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-500">
            {t("dash.eyebrowPanel")}
          </div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">
            {t("dash.greeting")}, <span className="gradient-text-aurora">{firstName}</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-500">
            {t("dash.stats.today")}
          </div>
          <div className="font-display text-4xl text-ink-900 mt-1">
            <AnimatedCounter to={todayCount} />
          </div>
        </div>
      </motion.div>

      <ProfileCard me={me} />

      <div data-tour="stats">
        <StatsCards me={me} appointments={apptsForMe} />
      </div>

      {/* Main 2-column grid — left: existing dashboard, right: NEW achievements + earnings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <AvailabilityManager me={me} />
          </div>
          <div className="lg:col-span-3">
            <AppointmentsList me={me} />
          </div>
        </div>
        <aside className="lg:col-span-1 space-y-6">
          <Achievements />
          <EarningsChart />
        </aside>
      </div>

      <PostRegisterTour />
    </motion.div>
  );
}
