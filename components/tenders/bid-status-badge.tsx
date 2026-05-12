"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { TenderBidStatus } from "@/lib/types";

const VARIANT_BY_STATUS: Record<
  TenderBidStatus,
  "warning-soft" | "success-soft" | "danger-soft"
> = {
  pending: "warning-soft",
  accepted: "success-soft",
  rejected: "danger-soft",
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
    <Badge variant={VARIANT_BY_STATUS[effective]}>
      {t(LABEL_KEY_BY_STATUS[effective])}
    </Badge>
  );
}
