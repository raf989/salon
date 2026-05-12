"use client";

import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { AvailabilityManager } from "@/components/dashboard/availability-manager";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import {
  useAppointments,
  useAppointmentsRealtime,
  useProvider,
  useProviders,
} from "@/lib/api/repo";

export default function DashboardPage() {
  // Live-refresh the appointment list when a client books / cancels.
  useAppointmentsRealtime();
  const providers = useProviders();
  const meId = providers[0]?.id;
  const me = useProvider(meId);
  const apptsForMe = useAppointments(meId ? { stylistId: meId } : undefined);

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
