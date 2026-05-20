"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Telescope } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useT, type DictKey } from "@/lib/i18n";
import {
  cancelAppointment,
  markAppointmentNoShow,
  useAppointments,
  useServices,
} from "@/lib/api/repo";
import type { Appointment, Service, Stylist } from "@/lib/types";
import { useNow } from "@/lib/use-now";
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
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState<boolean>(false);

  // Live clock comes from the shared `useNow` store — single interval for
  // the whole page, auto-paused when the tab is hidden.
  const nowMs = useNow().getTime();

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
    if (!pendingCancelId || cancelBusy) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await cancelAppointment(pendingCancelId);
      setPendingCancelId(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[AppointmentsList] cancelAppointment failed", err);
      setCancelError(t("dash.appts.cancel.error"));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div className="glass-strong rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-semibold text-xl text-ink-900">
          {t("dash.appts.title")}
        </h2>
        <span className="text-xs text-ink-500 font-mono">{total}</span>
      </div>

      {/* Segmented tabs */}
      <div className="mt-4 inline-flex p-1 glass border border-border rounded-[10px]">
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
        onClose={() => {
          if (cancelBusy) return;
          setPendingCancelId(null);
          setCancelError(null);
        }}
        title={t("dash.appts.cancel.confirm.title")}
      >
        <p className="text-sm text-ink-600">
          {t("dash.appts.cancel.confirm.body")}
        </p>
        {cancelError ? (
          <p
            role="alert"
            className="mt-3 text-sm font-medium text-pomegranate-500"
          >
            {cancelError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={cancelBusy}
            onClick={() => {
              setPendingCancelId(null);
              setCancelError(null);
            }}
          >
            {t("dash.appts.cancel.confirm.no")}
          </Button>
          <Button
            type="button"
            variant="urgent"
            disabled={cancelBusy}
            onClick={onConfirmCancel}
          >
            {t("dash.appts.cancel.confirm.yes")}
          </Button>
        </div>
      </Dialog>
    </div>
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
        "h-9 px-4 rounded-[8px] text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-br from-violet-500 to-magenta-500 text-white shadow-[var(--sh-glow-violet)]"
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4 rounded-xl glass border transition-all",
        // Subtle gold wash on "late" — attention without alarm.
        isLate
          ? "border-gold-500/40 hover:border-gold-500/60 hover:shadow-[var(--sh-glow-gold)]"
          : "border-border hover:border-violet-500/40 hover:shadow-[var(--sh-glow-violet)]",
      )}
    >
      {/* Date badge */}
      <div className="w-12 sm:w-14 flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center shrink-0">
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
            className="text-ink-500 hover:text-danger-500 hover:bg-danger-500/10 border border-transparent hover:border-danger-500/30"
          >
            {t("dash.appts.cancel")}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

const STATUS_PILL_CLASS =
  "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-tight backdrop-blur-sm border";

function StatusBadge({ display }: { display: DisplayStatus }) {
  const { t } = useT();
  switch (display) {
    case "completed":
      return (
        <span
          className={cn(
            STATUS_PILL_CLASS,
            "bg-success-500/15 text-success-500 border-success-500/30",
          )}
        >
          {t("dash.appts.status.completed")}
        </span>
      );
    case "cancelled":
      return (
        <span
          className={cn(
            STATUS_PILL_CLASS,
            "bg-danger-500/15 text-danger-500 border-danger-500/30",
          )}
        >
          {t("dash.appts.status.cancelled")}
        </span>
      );
    case "no_show":
      return (
        <span
          className={cn(
            STATUS_PILL_CLASS,
            "bg-danger-500/15 text-danger-500 border-danger-500/30",
          )}
        >
          {t("dash.appts.status.noShow")}
        </span>
      );
    case "late":
      return (
        <Badge variant="warning-soft" pulse>
          {t("dash.appts.status.late")}
        </Badge>
      );
    case "upcoming":
    default:
      // "Confirmed/upcoming" → cyan accent.
      return (
        <span
          className={cn(
            STATUS_PILL_CLASS,
            "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          )}
        >
          {t("dash.appts.status.upcoming")}
        </span>
      );
  }
}

function EmptyState() {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-14 text-center flex flex-col items-center"
    >
      <motion.span
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "size-16 rounded-full grid place-items-center",
          "bg-gradient-to-br from-violet-500/20 to-magenta-500/20",
          "border border-violet-500/30 text-violet-300",
          "shadow-[var(--sh-glow-violet)]",
        )}
      >
        <Telescope className="size-7" />
      </motion.span>
      <p className="text-ink-700 mt-4 text-sm font-semibold">
        {t("dash.appts.empty.title")}
      </p>
      <p className="text-ink-500 text-xs mt-1">{t("dash.appts.empty.sub")}</p>
    </motion.div>
  );
}
