"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { RatingStars } from "@/components/ui/rating-stars";
import { ProviderStatus } from "@/components/client/provider-status";
import { useServices } from "@/lib/api/repo";
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
  const allServices = useServices();

  const services = allServices.filter((s) => provider.serviceIds.includes(s.id));
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
  const cityName = pickLocalized(provider.city);

  const subtitle = (() => {
    const parts = [subtitleBase, cityName];
    if (provider.experienceYears) {
      parts.push(
        `${provider.experienceYears} ${t("provider.experienceYears")}`,
      );
    }
    return parts.join(" · ");
  })();

  // District in our data usually leads with the city ("Bakı, Nəsimi").
  // Strip that prefix so the address line doesn't repeat the city.
  const addressDetail = (() => {
    if (!provider.district) return null;
    const d = pickLocalized(provider.district).trim();
    if (!d) return null;
    if (d.toLowerCase().startsWith(cityName.toLowerCase() + ",")) {
      return d.slice(cityName.length + 1).trim() || null;
    }
    return d;
  })();

  const tagChips = provider.specialties.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="grid gap-4 p-3 md:grid-cols-[140px_1fr_180px] items-stretch hover:bg-bg transition-colors">
        <div className="relative">
          <Cover
            name={provider.name}
            id={provider.id}
            kind={provider.kind}
            aspect="1"
            className="rounded-xl"
          />
        </div>

        <div className="flex flex-col gap-2 py-2 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-display font-semibold text-lg text-ink-900 leading-tight">
              {provider.name}
            </h3>
            <ProviderStatus provider={provider} />
          </div>

          <p className="text-sm text-ink-500">{subtitle}</p>

          {addressDetail ? (
            <div className="flex items-center gap-1 text-sm text-ink-500 min-w-0">
              <MapPin className="size-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{addressDetail}</span>
            </div>
          ) : null}

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

          <div className="mt-auto flex items-center flex-wrap gap-1.5 text-sm text-ink-500 pt-1">
            <RatingStars value={provider.rating} size={14} />
            <span className="font-semibold text-ink-800">
              {provider.rating.toFixed(1)}
            </span>
            <Dot />
            <span>
              {provider.reviewsCount} {t("card.reviews")}
            </span>
          </div>
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

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={() => onBook(provider)}
      >
        {t(availableToday ? "action.bookNow" : "action.book")}
      </Button>
      <Link href={`/provider/${provider.id}`} className="w-full">
        <Button variant="outline" size="sm" className="w-full">
          {t("action.profile")}
        </Button>
      </Link>
    </div>
  );
}
