"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, MapPin } from "lucide-react";
import { useT, type DictKey } from "@/lib/i18n";
import type { Tender } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, getTodayISO } from "@/lib/utils";
import { SubmitBidModal } from "@/components/tenders/submit-bid-modal";

type Props = { tender: Tender };

const TENDER_CARD_STYLE = {
  background: "linear-gradient(180deg, #ffffff 0%, #FBF8EE 100%)",
  borderColor: "#F2E8C7",
} as const;

const BLOB_STYLE = {
  background:
    "radial-gradient(circle, var(--saffron-100), transparent 70%)",
} as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function computeMinutesAgo(openedAt: string, id: string): number {
  if (openedAt === getTodayISO()) {
    return (hashId(id) % 50) + 8;
  }
  // Older tenders: present as some larger value bucketed by hash (still "minutes ago" stylistically)
  return (hashId(id) % 180) + 60;
}

export function TenderCard({ tender }: Props) {
  const { t, pickLocalized } = useT();
  const [bidOpen, setBidOpen] = useState(false);

  const tierKey = `tier.${tender.tier}` as DictKey;
  const tierBadge = `${t("tenders.tenderBadge")} · ${t(tierKey)}`;
  const minutesAgo = computeMinutesAgo(tender.openedAt, tender.id);
  const openedAgo = t("tenders.openedAgo").replace("{n}", String(minutesAgo));
  const bidsLabel = t("tenders.bidsCount").replace(
    "{n}",
    String(tender.bidsCount),
  );
  const budgetLine = `${t("tenders.budget")}: ${formatPrice(tender.budgetMin)}–${formatPrice(tender.budgetMax)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[16px] border p-6 md:p-7"
      style={TENDER_CARD_STYLE}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full"
        style={BLOB_STYLE}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <Badge variant="event">{tierBadge}</Badge>
          <span className="text-xs text-ink-500 font-mono">
            {openedAgo} · {bidsLabel}
          </span>
        </div>

        <h2 className="font-display font-semibold text-2xl md:text-[32px] tracking-[-0.015em] leading-[1.2] text-ink-900 mt-3">
          {pickLocalized(tender.title)}
        </h2>

        <p className="text-ink-500 mt-3 leading-relaxed">
          {pickLocalized(tender.description)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          <span className="font-mono text-ink-700">{budgetLine}</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-ink-400" strokeWidth={1.7} />
            {pickLocalized(tender.district)}
          </span>
          <span>
            {t("tenders.author")}: {tender.authorName}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-5">
          {tender.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center h-7 px-2.5 rounded-full bg-transparent border border-border-strong text-xs font-medium text-ink-700"
            >
              {pickLocalized(tag)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setBidOpen(true)}
          >
            {t("tenders.action.bid")}
          </Button>
          <Button variant="outline">
            <Bookmark className="size-4" strokeWidth={1.7} />
            {t("tenders.action.save")}
          </Button>
        </div>
      </div>
      <SubmitBidModal
        tender={tender}
        open={bidOpen}
        onClose={() => setBidOpen(false)}
      />
    </motion.div>
  );
}
