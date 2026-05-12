"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarOff, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useT, type DictKey } from "@/lib/i18n";
import {
  cancelAppointment,
  markAppointmentNoShow,
  useAppointments,
  useServices,
} from "@/lib/api/repo";
import type { Appointment, Service, Stylist } from "@/lib/types";
import { cn, getTodayISO } from "@/lib/utils";

export type AppointmentsListProps = {
  me: Stylist;
};

type Tab = "upcoming" | "past";

// "late" is derived from time, not stored in DB. Everything else mirrors
// the persisted Appointment["status"].
type DisplayStatus =
  | "upcoming"
  | "late"
  | "completed"
  | "cancelled"
  | "no_show";

const NO_SHOW_AFTER_MIN = 31;
const TICK_MS = 30_000; // re-evaluate timing twice a minute

function apptStartTime(appt: Appointment): number {
  // Local-time interpretation matches how clients pick the slot in-app.
  return new Date(`${appt.date}T${appt.time}:00`).getTime();
}

function deriveDisplayStatus(
  appt: Appointment,
  nowMs: number,
): DisplayStatus {
  // Persisted terminal states win, listed alphabetically — only one can
  // match the strict equality, so order has no semantic effect.
  if (appt.status === "cancelled") return "cancelled";
  if (appt.status === "completed") return "completed";
  if (appt.status === "no_show") return "no_show";

  const diffMin = (nowMs - apptStartTime(appt)) / 60_000;
  if (diffMin >= NO_SHOW_AFTER_MIN) return "no_show";
  if (diffMin >= 0) return "late";
  return "upcoming";
}

export function AppointmentsList({ me }: AppointmentsListProps) {
  const { t } = useT();
  const services = useServices();
  const mine = useAppointments({ stylistId: me.id });

  const [tab, setTab] = useState<Tab>("upcoming");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  // Live clock: every TICK_MS we recompute display + check if any upcoming
  // appointment crossed the 31-minute mark and needs promoting to no_show.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const today = getTodayISO();

  // Auto-promotion to no_show in the DB. Once promoted, the appointment's
  // persisted status leaves "upcoming" and the row reappears in the past
  // tab on the next refetch. The ref de-dupes in-flight requests across
  // ticks before the refetch lands.
  const promotedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const appt of mine) {
      if (appt.status !== "upcoming") continue;
      if (deriveDisplayStatus(appt, nowMs) !== "no_show") continue;
      if (promotedRef.current.has(appt.id)) continue;
      promotedRef.current.add(appt.id);
      markAppointmentNoShow(appt.id).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[AppointmentsList] markAppointmentNoShow failed", err);
        promotedRef.current.delete(appt.id); // allow retry on next tick
      });
    }
  }, [mine, nowMs]);

  const { upcoming, past } = useMemo(() => {
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
  }, [mine, today]);

  const items = tab === "upcoming" ? upcoming : past;
  const total = upcoming.length + past.length;

  const onConfirmCancel = async () => {
    if (pendingCancelId) await cancelAppointment(pendingCancelId);
    setPendingCancelId(null);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-semibold text-xl text-ink-900">
          {t("dash.appts.title")}
        </h2>
        <span className="text-xs text-ink-500 font-mono">{total}</span>
      </div>

      {/* Segmented tabs */}
      <div className="mt-4 inline-flex p-1 bg-ink-50 rounded-[10px]">
        <SegmentTab active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          {t("dash.appts.tab.upcoming")}
        </SegmentTab>
        <SegmentTab active={tab === "past"} onClick={() => setTab("past")}>
          {t("dash.appts.tab.past")}
        </SegmentTab>
      </div>

      {/* List */}
      <div className="mt-5">
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
              items.map((appt, i) => {
                const display = deriveDisplayStatus(appt, nowMs);
                return (
                  <AppointmentRow
                    key={appt.id}
                    appt={appt}
                    display={display}
                    services={services}
                    index={i}
                    showCancel={
                      tab === "upcoming" && appt.status === "upcoming"
                    }
                    onCancel={() => setPendingCancelId(appt.id)}
                  />
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Dialog
        open={pendingCancelId !== null}
        onClose={() => setPendingCancelId(null)}
        title={t("dash.appts.cancel.confirm.title")}
      >
        <p className="text-sm text-ink-600">
          {t("dash.appts.cancel.confirm.body")}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPendingCancelId(null)}
          >
            {t("dash.appts.cancel.confirm.no")}
          </Button>
          <Button type="button" variant="urgent" onClick={onConfirmCancel}>
            {t("dash.appts.cancel.confirm.yes")}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

function SegmentTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 px-4 rounded-[8px] text-sm font-medium transition-colors",
        active
          ? "bg-surface text-ink-900 shadow-[var(--sh-1)]"
          : "text-ink-500 hover:text-ink-800",
      )}
    >
      {children}
    </button>
  );
}

function AppointmentRow({
  appt,
  display,
  services,
  index,
  showCancel,
  onCancel,
}: {
  appt: Appointment;
  display: DisplayStatus;
  services: Service[];
  index: number;
  showCancel: boolean;
  onCancel: () => void;
}) {
  const { t, pickLocalized } = useT();
  const service = services.find((s) => s.id === appt.serviceId);
  const [, monthStr, dayStr] = appt.date.split("-");
  const day = Number(dayStr);
  const monthIdx = Number(monthStr) - 1;
  const monthAbbr = t(`month.short.${monthIdx}` as DictKey);

  const isLate = display === "late";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className={cn(
        "flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-surface transition-colors",
        // Subtle saffron wash on "Gecikir" — attention without alarm.
        isLate
          ? "border-saffron-400/40 bg-saffron-50/40 hover:bg-saffron-50/60"
          : "border-border hover:bg-bg",
      )}
    >
      {/* Date badge */}
      <div className="w-12 sm:w-14 flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-xl bg-ink-50 text-center shrink-0">
        <span className="font-display font-semibold text-xl sm:text-2xl text-ink-900 leading-none">
          {day}
        </span>
        <span className="text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider text-ink-500 mt-1">
          {monthAbbr}
        </span>
      </div>

      {/* Client avatar */}
      <Avatar
        name={appt.clientName}
        id={appt.clientName + appt.id}
        size="md"
      />

      {/* Middle */}
      <div className="flex-1 min-w-0 order-3 sm:order-none basis-full sm:basis-auto">
        <div className="truncate text-sm">
          <span className="font-medium text-ink-900">{appt.clientName}</span>
          <span className="text-ink-500"> · {service ? pickLocalized(service.name) : "—"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <Clock className="size-3.5 text-ink-400" />
          <span className="font-mono text-sm text-ink-700">{appt.time}</span>
          {service ? (
            <span className="text-sm text-ink-500"> · {service.durationMin} {t("booking.minutes")}</span>
          ) : null}
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-2 ml-auto sm:ml-0">
        <StatusBadge display={display} />
        {showCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-ink-600 hover:text-pomegranate-500 hover:bg-pomegranate-500/5"
          >
            {t("dash.appts.cancel")}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

function StatusBadge({ display }: { display: DisplayStatus }) {
  const { t } = useT();
  switch (display) {
    case "completed":
      return (
        <Badge variant="success-soft">
          {t("dash.appts.status.completed")}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="danger-soft">
          {t("dash.appts.status.cancelled")}
        </Badge>
      );
    case "no_show":
      return (
        <Badge variant="danger-soft">{t("dash.appts.status.noShow")}</Badge>
      );
    case "late":
      return (
        <Badge variant="warning-soft" pulse>
          {t("dash.appts.status.late")}
        </Badge>
      );
    case "upcoming":
    default:
      return (
        <Badge variant="info-soft">{t("dash.appts.status.upcoming")}</Badge>
      );
  }
}

function EmptyState() {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="py-12 text-center flex flex-col items-center"
    >
      <span className="size-12 rounded-full bg-ink-50 grid place-items-center text-ink-400">
        <CalendarOff className="size-5" />
      </span>
      <p className="text-ink-500 mt-3 text-sm">{t("dash.appts.empty.title")}</p>
      <p className="text-ink-400 text-xs mt-1">
        {t("dash.appts.empty.sub")}
      </p>
    </motion.div>
  );
}
