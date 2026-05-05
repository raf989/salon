"use client";

import { ArrowRight, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { formatPrice, cn } from "@/lib/utils";
import type { Tender, TenderBid, TenderBidBadge } from "@/lib/types";

type Props = { tender: Tender };

function BidBadge({
  kind,
  rating,
  label,
}: {
  kind: TenderBidBadge;
  rating?: number;
  label: string;
}) {
  if (kind === "verified") {
    return <Badge variant="verified">{label}</Badge>;
  }
  if (kind === "topEvent") {
    return <Badge variant="event">{label}</Badge>;
  }
  if (kind === "fastResponse") {
    return <Badge variant="warning-soft">{label}</Badge>;
  }
  // rating
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

export function BidsPanel({ tender }: Props) {
  const { t } = useT();

  return (
    <Card className="p-5 flex flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        {t("tenders.bidPanel.title")}
      </div>

      <div className="mt-3">
        {tender.bids.map((bid, i) => (
          <BidRow key={bid.id} bid={bid} isFirst={i === 0} />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-4 justify-center"
      >
        {t("tenders.action.viewAll")}
        <ArrowRight className="size-4" strokeWidth={1.7} />
      </Button>
    </Card>
  );
}
