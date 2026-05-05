"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT, type DictKey } from "@/lib/i18n";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Tender } from "@/lib/types";

type Props = { tender: Tender };

const MAX_TAGS = 3;

export function TenderCardCompact({ tender }: Props) {
  const { t, lang, pickLocalized } = useT();

  const tierKey = `tier.${tender.tier}` as DictKey;
  const bidsLabel = t("tenders.bidsCount").replace(
    "{n}",
    String(tender.bidsCount),
  );

  return (
    <Card className="p-5 flex flex-col gap-3 hover:shadow-[var(--sh-2)] transition-shadow">
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
          {t("tenders.deadline")}:{" "}
          <span className="text-ink-700">
            {formatDate(tender.deadline, lang)}
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

      <Button variant="outline" size="sm" className="w-full mt-2">
        {t("tenders.action.bid")}
      </Button>
    </Card>
  );
}
