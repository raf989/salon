"use client";

import { Star } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { useTender } from "@/lib/api/repo";
import { cn, formatPrice } from "@/lib/utils";
import type { Tender, TenderBid, TenderBidBadge } from "@/lib/types";

type Props = {
  tender: Tender;
  open: boolean;
  onClose: () => void;
};

// NOTE: repo doesn't expose useTenderBids — we resubscribe to the parent tender
// (which cascades bid updates through the `tenders` resource version) and read
// `.bids` off it. Falls back to the prop's snapshot if the live one drops.
export function AllBidsModal({ tender, open, onClose }: Props) {
  const { t } = useT();
  const live = useTender(tender.id);
  const bids = live?.bids ?? tender.bids;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("tenders.allBids.title")}
      className="max-w-2xl"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        {bids.length === 0 ? (
          <p className="text-ink-500 text-sm py-6 text-center">
            {t("tenders.empty")}
          </p>
        ) : (
          <div className="flex flex-col">
            {bids.map((bid, i) => (
              <BidRow key={bid.id} bid={bid} isFirst={i === 0} />
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function BidBadge({
  kind,
  rating,
  label,
}: {
  kind: TenderBidBadge;
  rating?: number;
  label: string;
}) {
  if (kind === "verified") return <Badge variant="verified">{label}</Badge>;
  if (kind === "topEvent") return <Badge variant="event">{label}</Badge>;
  if (kind === "fastResponse") {
    return <Badge variant="warning-soft">{label}</Badge>;
  }
  return (
    <Badge variant="success-soft">
      <Star className="size-3 fill-current" strokeWidth={0} />
      {rating?.toFixed(1) ?? "—"}
    </Badge>
  );
}

function BidRow({ bid, isFirst }: { bid: TenderBid; isFirst: boolean }) {
  const { t, pickLocalized } = useT();

  const labelFor = (kind: TenderBidBadge): string => {
    switch (kind) {
      case "verified":
        return t("tenders.bidBadge.verified");
      case "topEvent":
        return t("tenders.bidBadge.topEvent");
      case "fastResponse":
        return t("tenders.bidBadge.fastResponse");
      case "rating":
        return "";
    }
  };

  return (
    <div className={cn(!isFirst && "border-t border-border pt-4 mt-4")}>
      <div className="flex items-start gap-3">
        <Avatar name={bid.providerName} id={bid.id} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <b className="text-ink-900 truncate">{bid.providerName}</b>
            <b className="font-mono text-ink-900 whitespace-nowrap">
              {formatPrice(bid.price)}
            </b>
          </div>
          <p className="text-sm text-ink-500 mt-1 leading-relaxed">
            {pickLocalized(bid.note)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bid.badges.map((kind) => (
              <BidBadge
                key={kind}
                kind={kind}
                rating={bid.rating}
                label={labelFor(kind)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
