"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarX, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { SERVICES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import type { Appointment, Stylist } from "@/lib/types";
import { cn, getTodayISO } from "@/lib/utils";

export type AppointmentsListProps = {
  me: Stylist;
};

type Tab = "upcoming" | "past";

const AZ_MONTH_ABBR = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avq",
  "sen",
  "okt",
  "noy",
  "dek",
];

export function AppointmentsList({ me }: AppointmentsListProps) {
  const appointments = useStore((s) => s.appointments);
  const cancelAppointment = useStore((s) => s.cancelAppointment);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const today = getTodayISO();

  const { upcoming, past } = useMemo(() => {
    const mine = appointments.filter((a) => a.stylistId === me.id);
    const up = mine
      .filter((a) => a.status === "upcoming" && a.date >= today)
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date),
      );
    const pst = mine
      .filter((a) => a.status !== "upcoming" || a.date < today)
      .sort((a, b) =>
        a.date === b.date
          ? b.time.localeCompare(a.time)
          : b.date.localeCompare(a.date),
      );
    return { upcoming: up, past: pst };
  }, [appointments, me.id, today]);

  const items = tab === "upcoming" ? upcoming : past;

  const onConfirmCancel = () => {
    if (pendingCancelId) cancelAppointment(pendingCancelId);
    setPendingCancelId(null);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-neutral-100">
          Görüşlərim
        </h2>
        <span className="text-xs text-neutral-500">
          {upcoming.length + past.length} ümumi
        </span>
      </div>

      {/* Tabs */}
      <div className="relative mt-4 flex gap-1 border-b border-white/5">
        <TabButton
          active={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
          count={upcoming.length}
        >
          Gələcək
        </TabButton>
        <TabButton
          active={tab === "past"}
          onClick={() => setTab("past")}
          count={past.length}
        >
          Keçmiş
        </TabButton>
      </div>

      {/* List */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-2.5"
          >
            {items.length === 0 ? (
              <EmptyState />
            ) : (
              items.map((appt, i) => (
                <AppointmentRow
                  key={appt.id}
                  appt={appt}
                  index={i}
                  showCancel={tab === "upcoming" && appt.status === "upcoming"}
                  onCancel={() => setPendingCancelId(appt.id)}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Dialog
        open={pendingCancelId !== null}
        onClose={() => setPendingCancelId(null)}
        title="Görüşü ləğv et"
      >
        <p className="text-sm text-neutral-300">
          Görüşü ləğv etmək istədiyinizə əminsiniz?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setPendingCancelId(null)}
          >
            İmtina
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirmCancel}
          >
            Bəli, ləğv et
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium tracking-tight transition-colors",
        active ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-200",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
            active
              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
              : "bg-white/[0.04] text-neutral-500",
          )}
        >
          {count}
        </span>
      </span>
      {active ? (
        <motion.span
          layoutId="appts-tab-underline"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
    </button>
  );
}

function AppointmentRow({
  appt,
  index,
  showCancel,
  onCancel,
}: {
  appt: Appointment;
  index: number;
  showCancel: boolean;
  onCancel: () => void;
}) {
  const service = SERVICES.find((s) => s.id === appt.serviceId);
  const [, monthStr, dayStr] = appt.date.split("-");
  const day = Number(dayStr);
  const monthAbbr = AZ_MONTH_ABBR[Number(monthStr) - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <Card className="p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Date badge */}
          <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 py-2 text-[var(--accent)]">
            <span className="text-lg font-semibold leading-none">{day}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wider opacity-80">
              {monthAbbr}
            </span>
          </div>

          {/* Middle */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-100">
              {appt.clientName}
            </div>
            <div className="mt-0.5 truncate text-xs text-neutral-400">
              {service?.name ?? "—"}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {appt.time}
              </span>
              {service ? (
                <>
                  <span className="text-neutral-700">·</span>
                  <span>{service.durationMin} dəq</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={appt.status} />
            {showCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                Ləğv et
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  if (status === "completed") {
    return <Badge variant="success">Tamamlandı</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="warning">Ləğv edildi</Badge>;
  }
  return <Badge variant="gold">Gözlənilir</Badge>;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-500">
        <CalendarX className="size-5" />
      </span>
      <p className="text-sm text-neutral-400">Hələ görüş yoxdur</p>
    </motion.div>
  );
}
