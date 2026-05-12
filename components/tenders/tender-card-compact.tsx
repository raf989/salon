"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT, type DictKey } from "@/lib/i18n";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Tender } from "@/lib/types";
import { SubmitBidModal } from "@/components/tenders/submit-bid-modal";
import { FavoriteToggle } from "@/components/tenders/favorite-toggle";

type Props = { tender: Tender };

const MAX_TAGS = 3;

export function TenderCardCompact({ tender }: Props) {
  const { t, lang, pickLocalized } = useT();
  const [bidOpen, setBidOpen] = useState(false);

  const tierKey = `tier.${tender.tier}` as DictKey;
  const bidsLabel = t("tenders.bidsCount").replace(
    "{n}",
    String(tender.bidsCount),
  );

  return (
    <Card
      id={tender.id}
      className="p-5 flex flex-col gap-3 hover:shadow-[var(--sh-2)] transition-shadow scroll-mt-20"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant={tender.tier === "event" ? "event" : "beauty"}>
          {t(tierKey)}
        </Badge>
        <span className="text-xs text-ink-400 font-mono">{bidsLabel}</span>
      </div>

      <h3 className="font-display font-semibold text-lg text-ink-900 leading-snug line-clamp-2">
        {pickLocalized(tender.title)}
      </h3>

      <div className="text-sm text-ink-500 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          {t("tenders.budget")}:{" "}
          <span className="font-mono text-ink-700">
            {formatPrice(tender.budgetMin)}–{formatPrice(tender.budgetMax)}
          </span>
        </span>
        <span className="text-ink-300">·</span>
        <span>
          {t("tenders.eventDate")}:{" "}
          <span className="text-ink-700">
            {formatDate(tender.eventDate ?? tender.deadline, lang)}
            {tender.eventTime ? ` · ${tender.eventTime}` : null}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tender.tags.slice(0, MAX_TAGS).map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center h-6 px-2 rounded-full bg-transparent border border-border-strong text-[11px] font-medium text-ink-700"
          >
            {pickLocalized(tag)}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setBidOpen(true)}
        >
          {t("tenders.action.bid")}
        </Button>
        <FavoriteToggle tenderId={tender.id} iconOnly />
      </div>
      <SubmitBidModal
        tender={tender}
        open={bidOpen}
        onClose={() => setBidOpen(false)}
      />
    </Card>
  );
}
