"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { HeartButton } from "@/components/ui/heart-button";
import { RatingStars } from "@/components/ui/rating-stars";
import { useServices } from "@/lib/api/repo";
import {
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

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function djBars(id: string, count: number): number[] {
  const seed = hashString(id);
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = ((seed >> (i % 8)) ^ (i * 2654435761)) >>> 0;
    bars.push(20 + (v % 80));
  }
  return bars;
}

export function ProviderCard({ provider, onBook, availableToday }: Props) {
  const { t, pickLocalized } = useT();
  const allServices = useServices();

  const services = allServices.filter((s) => provider.serviceIds.includes(s.id));
  const minPrice =
    services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0;
  const servicesCount = services.length;
  const tier = provider.tier;
  const priceUnit = pickLocalized(provider.priceUnit ?? PRICE_UNIT_FALLBACK);

  const subtitleKey = SUBTITLE_KEY_BY_KIND[provider.kind];
  const subtitle = (() => {
    if (provider.kind === "restaurant") {
      return t("meta.banquetsUpTo").replace("{n}", "180");
    }
    if (subtitleKey) return t(subtitleKey);
    return pickLocalized(KIND_LABELS[provider.kind]);
  })();

  const cityLine = (() => {
    const city = pickLocalized(provider.city);
    if (provider.district) {
      return `${city}, ${pickLocalized(provider.district)}`;
    }
    return city;
  })();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="h-full"
    >
      <Card
        interactive
        className="overflow-hidden p-0 flex flex-col h-full"
      >
        <Cover
          name={provider.name}
          id={provider.id}
          kind={provider.kind}
          aspect="4/3"
        >
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge variant={tier === "event" ? "event" : "beauty"}>
              {t(tier === "event" ? "tier.event" : "tier.beauty")}
            </Badge>
            {availableToday ? (
              <Badge variant="success-soft" pulse>
                {t("provider.freeToday")}
              </Badge>
            ) : provider.verified ? (
              <Badge variant="verified">{t("provider.verified")}</Badge>
            ) : null}
          </div>
          <HeartButton className="absolute top-3 right-3" />
          <SecondFloor
            kind={provider.kind}
            id={provider.id}
            servicesCount={servicesCount}
            minPrice={minPrice}
          />
        </Cover>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-base md:text-[16px] text-ink-900 leading-tight truncate">
                {provider.name}
              </h3>
              <p className="text-sm text-ink-500 mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono font-semibold text-base text-ink-900 whitespace-nowrap">
                {t("meta.minPriceSuffix")} {formatPrice(minPrice)}
              </div>
              <div className="text-xs text-ink-400">/ {priceUnit}</div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 text-sm text-ink-500">
            <RatingStars value={provider.rating} size={14} />
            <span className="font-semibold text-ink-800">
              {provider.rating.toFixed(1)}
            </span>
            <span
              aria-hidden
              className="size-[3px] rounded-full bg-ink-200"
            />
            <span>
              {provider.reviewsCount} {t("card.reviews")}
            </span>
            <span
              aria-hidden
              className="size-[3px] rounded-full bg-ink-200"
            />
            <span className="truncate">{cityLine}</span>
          </div>

          <CardActions
            provider={provider}
            onBook={onBook}
            availableToday={availableToday}
          />
        </div>
      </Card>
    </motion.div>
  );
}

function SecondFloor({
  kind,
  id,
  servicesCount,
  minPrice,
}: {
  kind: ProviderKind;
  id: string;
  servicesCount: number;
  minPrice: number;
}) {
  const { t, lang } = useT();

  if (kind === "photographer") {
    return (
      <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-gradient-to-t from-black/35 to-transparent">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="flex-1 h-9 rounded-md bg-white/65 backdrop-blur-sm"
          />
        ))}
      </div>
    );
  }

  if (kind === "dj") {
    const bars = djBars(id, 14);
    return (
      <div className="absolute left-3 right-3 bottom-3 flex items-end gap-[3px] h-10">
        {bars.map((h, i) => (
          <i
            key={i}
            className="bg-white/85 rounded-sm flex-1 block"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  }

  if (kind === "restaurant") {
    return (
      <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-full text-[12px] font-semibold text-ink-800">
        <Utensils className="size-3.5" strokeWidth={1.7} />
        {t("meta.menuOf")} · 32
      </span>
    );
  }

  if (kind === "host") {
    return (
      <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-ink-800">
        Az · Ru · Tr
      </span>
    );
  }

  // barber, salon, makeup
  const minLabel =
    lang === "az"
      ? `${minPrice} ₼-dən · ${servicesCount} xidmət`
      : `от ${minPrice} ₼ · ${servicesCount} услуг`;
  return (
    <span className="absolute right-3 bottom-3 bg-ink-900/85 text-white text-[12px] font-mono font-semibold px-2.5 py-1.5 rounded-lg">
      {minLabel}
    </span>
  );
}

function CardActions({
  provider,
  onBook,
  availableToday,
}: {
  provider: Provider;
  onBook: (p: Provider) => void;
  availableToday: boolean;
}) {
  const { t } = useT();
  const profileHref = `/provider/${provider.id}`;

  switch (provider.kind) {
    case "photographer":
      return (
        <div className="flex gap-2 mt-auto">
          <Link href={profileHref} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              {t("action.profile")}
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onBook(provider)}
          >
            {t("action.book")}
          </Button>
        </div>
      );
    case "dj":
      return (
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" className="flex-1">
            {t("action.demoSet")}
          </Button>
          <Button variant="whatsapp" size="sm" className="flex-1">
            <MessageCircle size={14} strokeWidth={1.8} />
            WhatsApp
          </Button>
        </div>
      );
    case "restaurant":
      return (
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" className="flex-1">
            {t("action.menu")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onBook(provider)}
          >
            {t("action.bookTable")}
          </Button>
        </div>
      );
    case "host":
      return (
        <div className="flex gap-2 mt-auto">
          <Link href={profileHref} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              {t("action.profile")}
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onBook(provider)}
          >
            {t("action.book")}
          </Button>
        </div>
      );
    case "barber":
    case "salon":
    case "makeup": {
      const useUrgent = availableToday;
      return (
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" className="flex-1">
            {t("action.priceList")}
          </Button>
          {useUrgent ? (
            <Button
              variant="urgent"
              size="sm"
              className="flex-1"
              onClick={() => onBook(provider)}
            >
              {t("action.bookNow")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onBook(provider)}
            >
              {t("action.book")}
            </Button>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
