"use client";

import Link from "next/link";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointments, useAppointmentsRealtime } from "@/lib/api/repo";
import { useMyProvider } from "@/lib/use-my-provider";
import { useT } from "@/lib/i18n";
import { SkeletonDashboard } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { t } = useT();
  // Resolves "me" by Firebase UID and self-heals a missing provider row.
  // Anonymous → redirected to /login, clients → redirected to / inside
  // the hook; we only see loading | ready | incomplete here.
  const { status, me } = useMyProvider();

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

  // Logged in but no `users` profile to build a provider from — give a
  // clear recovery path instead of a blank page.
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

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6 md:pt-10 space-y-6">
      <ProfileCard me={me} />
      <StatsCards me={me} appointments={apptsForMe} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AvailabilityManager me={me} />
        </div>
        <div className="lg:col-span-3">
          <AppointmentsList me={me} />
        </div>
      </div>
    </div>
  );
}
