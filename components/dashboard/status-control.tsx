"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { updateProvider } from "@/lib/api/repo";
import { getStatus, type DerivedStatus } from "@/lib/get-status";
import { useT, type DictKey } from "@/lib/i18n";
import type { Stylist } from "@/lib/types";
import { cn } from "@/lib/utils";

const TICK_MS = 60_000; // re-evaluate the time-based status every minute

const STATUS_TONE: Record<
  DerivedStatus,
  { pill: string; dot: string; pulse: boolean; labelKey: DictKey }
> = {
  open: {
    pill: "bg-success-50 text-success-500",
    dot: "bg-success-500",
    pulse: true,
    labelKey: "dash.status.open",
  },
  break: {
    pill: "bg-warning-50 text-warning-500",
    dot: "bg-warning-500",
    pulse: true,
    labelKey: "dash.status.break",
  },
  closed: {
    pill: "bg-danger-50 text-danger-500",
    dot: "bg-danger-500",
    pulse: false,
    labelKey: "dash.status.closed",
  },
};

export function StatusControl({ provider }: { provider: Stylist }) {
  const { t } = useT();
  const [now, setNow] = useState<Date>(() => new Date());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-evaluate the time-based status every minute so it flips at the
  // exact moment working hours end / a break starts / etc.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Outside-click + Escape close the dropdown.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const status = getStatus(
    now,
    provider.workingHours,
    provider.breaks,
    provider.manualStatus,
  );
  const tone = STATUS_TONE[status];

  const setManual = async (next: "open" | "closed" | null) => {
    setOpen(false);
    setBusy(true);
    try {
      await updateProvider(provider.id, { manualStatus: next });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[StatusControl] failed to update manual_status", err);
    } finally {
      setBusy(false);
    }
  };

  const isManualClosed = provider.manualStatus === "closed";

  return (
    // `relative z-[999]` lifts the whole control above neighbour sections
    // (StatsCards etc.) so the dropdown is never visually trapped under them.
    <div ref={wrapRef} className="relative z-[999]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 h-7 px-2.5 rounded-full text-[11px] font-semibold tracking-tight transition-colors",
          tone.pill,
          busy && "opacity-60",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone.dot,
            tone.pulse && "animate-pulse",
          )}
          aria-hidden
        />
        {t(tone.labelKey)}
        <ChevronDown
          className={cn(
            "size-3 transition-transform opacity-70",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="status-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-2 w-44 origin-top-left bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-1.5 z-[999]"
          >
            <Option
              label={t("dash.status.optionOpen")}
              active={!isManualClosed}
              tone="bg-success-500"
              onClick={() => setManual(null)}
            />
            <Option
              label={t("dash.status.optionClosed")}
              active={isManualClosed}
              tone="bg-danger-500"
              onClick={() => setManual("closed")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Option({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 h-9 rounded-lg text-sm transition-colors",
        active
          ? "bg-ink-50 text-ink-900 font-semibold"
          : "text-ink-700 hover:bg-ink-50",
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className={cn("size-1.5 rounded-full", tone)} aria-hidden />
        {label}
      </span>
      {active && <Check className="size-3.5 text-caspian-600" />}
    </button>
  );
}
