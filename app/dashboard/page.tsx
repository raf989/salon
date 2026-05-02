"use client";

import { useMemo } from "react";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { STYLISTS } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

const ME = STYLISTS[0];

export default function DashboardPage() {
  const appointments = useStore((s) => s.appointments);

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.stylistId === ME.id),
    [appointments],
  );

  return (
    <div className="container mx-auto space-y-8 px-4 pb-24 pt-8 md:pt-12">
      <ProfileCard me={ME} />
      <StatsCards me={ME} appointments={myAppointments} />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AvailabilityManager me={ME} />
        </div>
        <div className="lg:col-span-3">
          <AppointmentsList me={ME} />
        </div>
      </div>
    </div>
  );
}
