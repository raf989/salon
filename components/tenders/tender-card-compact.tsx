"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
      className="p-5 flex flex-col gap-3 bg-surface/70 backdrop-blur-md border-border-strong rounded-2xl transition hover:border-violet-500/40 hover:shadow-[var(--sh-glow-violet)] hover:-translate-y-px scroll-mt-20"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-[11px] font-medium text-violet-300">
          {t(tierKey)}
        </span>
      </div>

      <h3 className="font-display font-semibold text-lg text-ink-900 leading-snug line-clamp-2">
        {pickLocalized(tender.title)}
      </h3>

      <div className="text-sm text-ink-500 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center h-6 px-2 rounded-full bg-violet-500/15 border border-violet-500/25 text-[11px] font-mono text-violet-300">
          {bidsLabel}
        </span>
        <span className="inline-flex items-center h-6 px-2 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 font-mono text-[11px]">
          {formatPrice(tender.budgetMin)}–{formatPrice(tender.budgetMax)}
        </span>
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
            className="inline-flex items-center h-6 px-2 rounded-full bg-surface-2/60 border border-border-strong text-[11px] font-medium text-ink-700"
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
