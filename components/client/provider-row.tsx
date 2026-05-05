"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { RatingStars } from "@/components/ui/rating-stars";
import { SERVICES } from "@/lib/mock-data";
import {
  CATEGORY_LABELS,
  KIND_LABELS,
  type Localized,
  type Provider,
  type ProviderKind,
} from "@/lib/types";
import { useT, type DictKey } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";

type Props = {
  provider: Provider;
  onBook: (p: Provider) => void;
  availableToday: boolean;
};

const PRICE_UNIT_FALLBACK: Localized = { az: "saat", ru: "час" };

const SUBTITLE_KEY_BY_KIND: Partial<Record<ProviderKind, DictKey>> = {
  photographer: "meta.weddingPhotographer",
  dj: "meta.weddingsAndCorp",
  barber: "meta.barberServices",
  host: "meta.weddingHost",
};

export function ProviderRow({ provider, onBook, availableToday }: Props) {
  const { t, pickLocalized } = useT();

  const services = SERVICES.filter((s) => provider.serviceIds.includes(s.id));
  const minPrice =
    services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0;
  const priceUnit = pickLocalized(provider.priceUnit ?? PRICE_UNIT_FALLBACK);

  const subtitleKey = SUBTITLE_KEY_BY_KIND[provider.kind];
  const subtitleBase = (() => {
    if (provider.kind === "restaurant") {
      return t("meta.banquetsUpTo").replace("{n}", "180");
    }
    if (subtitleKey) return t(subtitleKey);
    return pickLocalized(KIND_LABELS[provider.kind]);
  })();
  const subtitle = (() => {
    if (provider.experienceYears) {
      return `${subtitleBase} · ${provider.experienceYears} ${t("provider.experienceYears")}`;
    }
    return subtitleBase;
  })();

  const cityLine = (() => {
    const city = pickLocalized(provider.city);
    if (provider.district) {
      return `${city}, ${pickLocalized(provider.district)}`;
    }
    return city;
  })();

  const respondsLine = provider.responseMins
    ? t("provider.respondsIn").replace("{n}", String(provider.responseMins))
    : null;

  const tagChips = provider.specialties.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="grid gap-5 p-3 md:grid-cols-[200px_1fr_180px] items-stretch hover:bg-bg transition-colors">
        <div className="relative">
          <Cover
            name={provider.name}
            id={provider.id}
            kind={provider.kind}
            aspect="1"
            className="rounded-xl"
          >
            {availableToday ? (
              <Badge
                variant="success-soft"
                pulse
                className="absolute top-2 left-2"
              >
                {t("provider.freeToday")}
              </Badge>
            ) : null}
          </Cover>
        </div>

        <div className="flex flex-col gap-2 py-2 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-display font-semibold text-lg text-ink-900 leading-tight">
              {provider.name}
            </h3>
            {provider.verified ? (
              <Badge variant="verified">{t("provider.verified")}</Badge>
            ) : null}
            <Badge variant={provider.tier === "event" ? "event" : "beauty"}>
              {t(provider.tier === "event" ? "tier.event" : "tier.beauty")}
            </Badge>
          </div>

          <p className="text-sm text-ink-500">{subtitle}</p>

          <div className="flex items-center flex-wrap gap-1.5 text-sm text-ink-500">
            <RatingStars value={provider.rating} size={14} />
            <span className="font-semibold text-ink-800">
              {provider.rating.toFixed(1)}
            </span>
            <Dot />
            <span>
              {provider.reviewsCount} {t("card.reviews")}
            </span>
            {respondsLine ? (
              <>
                <Dot />
                <span>{respondsLine}</span>
              </>
            ) : null}
            <Dot />
            <span className="truncate">{cityLine}</span>
          </div>

          {tagChips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tagChips.map((c) => (
                <span
                  key={c}
                  className="text-xs h-6 px-2 rounded-full bg-ink-50 text-ink-700 inline-flex items-center"
                >
                  {pickLocalized(CATEGORY_LABELS[c])}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end justify-between py-2 gap-2 min-w-[170px]">
          <div className="text-right">
            <div className="font-mono font-semibold text-xl text-ink-900 whitespace-nowrap">
              {t("meta.minPriceSuffix")} {formatPrice(minPrice)}
            </div>
            <div className="text-xs text-ink-400">/ {priceUnit}</div>
          </div>
          <RowActions
            provider={provider}
            onBook={onBook}
            availableToday={availableToday}
          />
        </div>
      </Card>
    </motion.div>
  );
}

function Dot() {
  return <span aria-hidden className="size-[3px] rounded-full bg-ink-200" />;
}

function RowActions({
  provider,
  onBook,
  availableToday,
}: {
  provider: Provider;
  onBook: (p: Provider) => void;
  availableToday: boolean;
}) {
  const { t } = useT();

  const primary = (() => {
    switch (provider.kind) {
      case "restaurant":
        return (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onBook(provider)}
          >
            {t("action.bookTable")}
          </Button>
        );
      case "dj":
        return (
          <Button variant="whatsapp" size="sm" className="w-full">
            <MessageCircle size={14} strokeWidth={1.8} />
            WhatsApp
          </Button>
        );
      case "barber":
      case "salon":
      case "makeup":
        return availableToday ? (
          <Button
            variant="urgent"
            size="sm"
            className="w-full"
            onClick={() => onBook(provider)}
          >
            {t("action.bookNow")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onBook(provider)}
          >
            {t("action.book")}
          </Button>
        );
      default:
        return (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onBook(provider)}
          >
            {t("action.book")}
          </Button>
        );
    }
  })();

  const secondary = provider.kind === "dj" ? null : (
    <Link href={`/provider/${provider.id}`} className="w-full">
      <Button variant="outline" size="sm" className="w-full">
        {t("action.profile")}
      </Button>
    </Link>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {primary}
      {secondary}
    </div>
  );
}
