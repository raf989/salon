"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BidStatusBadge } from "@/components/tenders/bid-status-badge";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { updateBidStatus } from "@/lib/api/repo";
import type { Tender, TenderBid } from "@/lib/types";

type Props = {
  bid: TenderBid;
  tender: Tender;
};

/**
 * Shows the bid's status badge to everyone, and accept/reject controls to
 * the tender's author. Owner check now uses the Firebase UID on the tender
 * (`tender.authUserId`) — the previous name-equality check broke as soon
 * as the author renamed their profile. Legacy tenders without authUserId
 * (seed data) fall back to the name match so historical bids still get
 * the author UI on the original creator's account.
 */
export function BidAuthorActions({ bid, tender }: Props) {
  const { t } = useT();
  const currentUser = useCurrentUser();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = (() => {
    if (!currentUser) return false;
    if (tender.authUserId) return tender.authUserId === currentUser.id;
    return currentUser.name.trim() === tender.authorName.trim();
  })();

  const current = bid.status ?? "pending";

  const updateStatus = async (
    next: "pending" | "accepted" | "rejected",
  ) => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await updateBidStatus(bid.id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <BidStatusBadge status={current} />
        {isAuthor ? (
          <>
            {current !== "accepted" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-success-500 hover:bg-success-50 h-9 sm:h-7 px-3 sm:px-2.5"
                disabled={pending}
                onClick={() => updateStatus("accepted")}
              >
                <Check className="size-3.5" />
                {t("bid.accept")}
              </Button>
            ) : null}
            {current !== "rejected" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-pomegranate-500 hover:bg-pomegranate-50 h-9 sm:h-7 px-3 sm:px-2.5"
                disabled={pending}
                onClick={() => updateStatus("rejected")}
              >
                <X className="size-3.5" />
                {t("bid.reject")}
              </Button>
            ) : null}
            {current !== "pending" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-ink-500 h-9 sm:h-7 px-3 sm:px-2.5"
                disabled={pending}
                onClick={() => updateStatus("pending")}
              >
                <RotateCcw className="size-3.5" />
                {t("bid.unaccept")}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-pomegranate-500">{error}</p>
      ) : null}
    </div>
  );
}
