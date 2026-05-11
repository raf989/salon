"use client";

import { getStatus, type DerivedStatus } from "@/lib/get-status";
import { useT, type DictKey } from "@/lib/i18n";
import type { Provider } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

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

/**
 * Read-only live status pill for catalog cards. Mirrors the colour scheme
 * of the dashboard's interactive StatusControl but takes no input — the
 * status is derived from working hours, breaks and the manual override.
 */
export function ProviderStatus({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) {
  const { t } = useT();
  const now = useNow();
  const status = getStatus(
    now,
    provider.workingHours,
    provider.breaks,
    provider.manualStatus,
  );
  const tone = STATUS_TONE[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-tight",
        tone.pill,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone.dot,
          tone.pulse && "animate-pulse",
        )}
      />
      {t(tone.labelKey)}
    </span>
  );
}
