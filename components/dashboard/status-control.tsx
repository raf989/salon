"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { updateProvider } from "@/lib/api/repo";
import { getStatus, type DerivedStatus } from "@/lib/get-status";
import { useT, type DictKey } from "@/lib/i18n";
import type { Stylist } from "@/lib/types";
import { cn } from "@/lib/utils";

const TICK_MS = 60_000;

const SEGMENT_ORDER: DerivedStatus[] = ["open", "break", "closed"];

// Visual tone per segment when *active*. Inactive uses muted ink colors.
const ACTIVE_GRADIENT: Record<DerivedStatus, string> = {
  open: "from-cyan-500 via-violet-500 to-magenta-500",
  break: "from-gold-500 to-magenta-500",
  closed: "from-magenta-500 to-magenta-600",
};

const ACTIVE_GLOW: Record<DerivedStatus, string> = {
  open: "shadow-[var(--sh-glow-violet)]",
  break: "shadow-[var(--sh-glow-gold)]",
  closed: "shadow-[var(--sh-glow-magenta)]",
};

const LABEL_KEY: Record<DerivedStatus, DictKey> = {
  open: "dash.status.open",
  break: "dash.status.break",
  closed: "dash.status.closed",
};

export function StatusControl({ provider }: { provider: Stylist }) {
  const { t } = useT();
  const [now, setNow] = useState<Date>(() => new Date());
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const status = getStatus(
    now,
    provider.workingHours,
    provider.breaks,
    provider.manualStatus,
  );

  const setManual = async (next: "open" | "closed" | null) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await updateProvider(provider.id, { manualStatus: next });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[StatusControl] failed to update manual_status", err);
      setErrorMsg(t("dash.status.updateError"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!errorMsg) return;
    const id = window.setTimeout(() => setErrorMsg(null), 4000);
    return () => window.clearTimeout(id);
  }, [errorMsg]);

  // "break" is time-derived, not a manual toggle — clicking it is a no-op
  // hint state. open / closed dispatch to setManual.
  const onClickSegment = (seg: DerivedStatus) => {
    if (busy) return;
    if (seg === "open") void setManual(null);
    else if (seg === "closed") void setManual("closed");
    // "break" is informational only.
  };

  return (
    <div className="relative">
      <div
        role="group"
        aria-label={t("dash.status.open")}
        className={cn(
          "inline-flex items-center glass-strong rounded-full p-1 border border-border",
          busy && "opacity-70",
        )}
      >
        {SEGMENT_ORDER.map((seg) => {
          const active = seg === status;
          const isBreak = seg === "break";
          return (
            <button
              key={seg}
              type="button"
              aria-pressed={active}
              onClick={() => onClickSegment(seg)}
              disabled={busy || (isBreak && !active)}
              className={cn(
                "relative h-7 px-3 rounded-full text-[11px] font-semibold tracking-tight transition-colors",
                active ? "text-white" : "text-ink-500 hover:text-ink-900",
                isBreak && !active && "opacity-50 cursor-default",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="status-pill"
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 28,
                  }}
                  className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-br",
                    ACTIVE_GRADIENT[seg],
                    ACTIVE_GLOW[seg],
                  )}
                />
              ) : null}
              <span className="relative inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    active
                      ? "bg-white animate-pulse"
                      : seg === "open"
                        ? "bg-success-500"
                        : seg === "break"
                          ? "bg-gold-500"
                          : "bg-danger-500",
                  )}
                />
                {t(LABEL_KEY[seg])}
              </span>
            </button>
          );
        })}
      </div>
      {errorMsg ? (
        <p
          role="alert"
          className="absolute left-0 top-full mt-2 text-xs text-danger-500 whitespace-nowrap"
        >
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}
