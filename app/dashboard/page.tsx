"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useAppointments,
  useAppointmentsRealtime,
  useProviderByAuthUserId,
} from "@/lib/api/repo";
import { useAuthState } from "@/lib/auth";
import { useCurrentUser } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { SkeletonDashboard } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useT();
  const { user, ready } = useAuthState();
  const currentUser = useCurrentUser();

  // Resolve "me" by the Firebase UID — replaces the old `useProviders()[0]`
  // seed-era hack that showed every provider the first catalog row.
  const { provider: me, loaded: meLoaded } = useProviderByAuthUserId(
    user?.uid ?? null,
  );

  // Live-refresh the appointment list when a client books / cancels.
  useAppointmentsRealtime();
  const apptsForMe = useAppointments(me ? { stylistId: me.id } : undefined);

  // Auth guard — once Firebase has resolved, kick anonymous visitors to login.
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  // Role guard — clients have no dashboard; send them home. Only fires once
  // the profile is known (currentUser non-null) so we don't bounce a
  // provider mid-hydration.
  useEffect(() => {
    if (ready && user && currentUser && currentUser.role === "client") {
      router.replace("/");
    }
  }, [ready, user, currentUser, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6 md:pt-10">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!meLoaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6 md:pt-10">
        <SkeletonDashboard />
      </div>
    );
  }

  // Authenticated, but no provider row. Either a client (the role guard
  // above will redirect) or a provider whose row failed to create at
  // registration — give them a clear recovery path instead of a blank page.
  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-24 pt-16">
        <Card className="p-8 text-center flex flex-col items-center gap-4">
          <h1 className="font-display font-semibold text-2xl text-ink-900">
            {t("dash.noProvider.title")}
          </h1>
          <p className="text-ink-500 text-sm">
            {t("dash.noProvider.body")}
          </p>
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
