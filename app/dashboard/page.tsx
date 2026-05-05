"use client";

import { useMemo } from "react";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { STYLISTS } from "@/lib/mock-data";
import { useStore, useProvider } from "@/lib/store";

const ME_ID = STYLISTS[0].id;

export default function DashboardPage() {
  const me = useProvider(ME_ID);
  const appointments = useStore((s) => s.appointments);

  const apptsForMe = useMemo(
    () => appointments.filter((a) => a.stylistId === ME_ID),
    [appointments],
  );

  if (!me) return null;

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
