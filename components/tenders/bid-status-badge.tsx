"use client";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TenderBidStatus } from "@/lib/types";

// Dark Midnight Aurora palette per status.
// `accepted` gets a subtle success glow for emphasis.
const CLASS_BY_STATUS: Record<TenderBidStatus, string> = {
  pending: "bg-gold-500/15 text-gold-400 border-gold-500/30",
  accepted:
    "bg-success-500/15 text-success-500 border-success-500/30 shadow-[0_0_12px_rgba(45,232,155,0.25)]",
  rejected: "bg-danger-500/15 text-danger-500 border-danger-500/30",
};

const LABEL_KEY_BY_STATUS = {
  pending: "bid.status.pending",
  accepted: "bid.status.accepted",
  rejected: "bid.status.rejected",
} as const;

export function BidStatusBadge({
  status,
}: {
  status: TenderBidStatus | undefined;
}) {
  const { t } = useT();
  const effective = status ?? "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-medium",
        CLASS_BY_STATUS[effective],
      )}
    >
      {t(LABEL_KEY_BY_STATUS[effective])}
    </span>
  );
}
