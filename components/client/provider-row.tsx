"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { HeartButton } from "@/components/ui/heart-button";
import { RatingStars } from "@/components/ui/rating-stars";
import { useServices } from "@/lib/api/repo";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { isWithinHours, toMinutes } from "@/lib/slots";
import {
  CATEGORY_LABELS,
  KIND_LABELS,
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

const SUBTITLE_KEY_BY_KIND: Partial<Record<ProviderKind, DictKey>> = {
  photographer: "meta.weddingPhotographer",
  dj: "meta.weddingsAndCorp",
  barber: "meta.barberServices",
  host: "meta.weddingHost",
};

export function ProviderRow({ provider, onBook, availableToday }: Props) {
  const { t, pickLocalized } = useT();
  const allServices = useServices();
  // Show the provider's real uploaded photo when there is one; fall back
  // to the gradient `Cover` otherwise (or if the image URL is broken).
  const [avatarFailed, setAvatarFailed] = useState(false);
  // Pure time-vs-hours check. We deliberately ignore manualStatus here —
  // this pill shows whether the displayed range covers "now", not whether
  // the provider has admin-closed themselves.
  const now = useNow();
  const isOpen = (() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (
      !isWithinHours(
        nowMin,
        provider.workingHours.start,
        provider.workingHours.end,
      )
    ) {
      return false;
    }
    return !provider.breaks.some(
      (b) => nowMin >= toMinutes(b.start) && nowMin < toMinutes(b.end),
    );
  })();

  const services = allServices.filter((s) => provider.serviceIds.includes(s.id));
  const minPrice =
    services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0;

  const subtitleKey = SUBTITLE_KEY_BY_KIND[provider.kind];
  // Restaurants fall through to KIND_LABELS — the previous hard-coded
  // "180 guests" line was data-fabricated and identical for every restaurant,
  // so the localised kind label ("Restoran"/"Ресторан") + city + experience
  // years are a more honest subtitle.
  const subtitleBase = (() => {
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
      <Card className="relative grid gap-3 md:gap-4 p-3 grid-cols-[96px_1fr] md:grid-cols-[140px_1fr_180px] items-stretch hover:bg-bg transition-colors">
        {/* Stretched link covers the whole card — clicking anywhere outside
            an interactive child opens the profile. Inner buttons / the
            Heart toggle sit above via `relative z-10`. */}
        <Link
          href={`/provider/${provider.slug}`}
          aria-label={provider.name}
          className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caspian-500 focus-visible:ring-offset-2"
        />
        <div className="relative z-10">
          {provider.avatar && !avatarFailed ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ink-50">
              <Image
                src={provider.avatar}
                alt={provider.name}
                fill
                unoptimized
                sizes="(min-width: 768px) 140px, 96px"
                className="object-cover"
                onError={() => setAvatarFailed(true)}
              />
            </div>
          ) : (
            <Cover
              name={provider.name}
              id={provider.id}
              kind={provider.kind}
              aspect="1"
              className="rounded-xl"
            />
          )}
          <HeartButton
            providerId={provider.id}
            className="absolute top-1.5 right-1.5 size-9 md:size-auto md:top-2 md:right-2"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-1.5 md:gap-2 py-1 md:py-2 min-w-0 pointer-events-none">
          <div className="flex items-start flex-wrap gap-x-2 gap-y-1 min-w-0">
            <h3 className="font-display font-semibold text-base md:text-lg text-ink-900 leading-tight min-w-0 break-words">
              {provider.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] md:text-xs font-mono font-semibold shrink-0",
                isOpen ? "text-success-500" : "text-danger-500",
              )}
            >
              <Clock className="size-3.5" />
              {provider.workingHours.start}–{provider.workingHours.end}
            </span>
          </div>

          <p className="text-xs md:text-sm text-ink-500 line-clamp-2">{subtitle}</p>

          {addressDetail ? (
            <div className="hidden md:flex items-center gap-1 text-sm text-ink-500 min-w-0">
              <MapPin className="size-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{addressDetail}</span>
            </div>
          ) : null}

          {tagChips.length > 0 ? (
            <div className="hidden md:flex flex-wrap gap-1.5 mt-1">
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

          <div className="mt-auto flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs md:text-sm text-ink-500 pt-1">
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

        {/* Mobile-only price + Book button row */}
        <div className="relative z-10 col-span-2 flex items-end justify-between gap-3 border-t border-border pt-3 md:hidden pointer-events-none">
          <div className="min-w-0 leading-tight whitespace-nowrap flex items-baseline gap-1.5">
            <span className="text-xs text-ink-400 font-medium">
              {t("meta.minPriceSuffix")}
            </span>
            <span className="font-mono font-semibold text-xl text-ink-900">
              {formatPrice(minPrice)}
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            className="h-11 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onBook(provider);
            }}
          >
            {t(availableToday ? "action.bookNow" : "action.book")}
          </Button>
        </div>

        {/* Desktop-only right column with stacked price + Book button */}
        <div className="relative z-10 hidden md:flex flex-col items-end justify-between py-2 gap-2 min-w-[170px] pointer-events-none">
          <div className="whitespace-nowrap flex items-baseline justify-end gap-1.5">
            <span className="text-xs text-ink-400 font-medium">
              {t("meta.minPriceSuffix")}
            </span>
            <span className="font-mono font-semibold text-xl text-ink-900">
              {formatPrice(minPrice)}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="w-full pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onBook(provider);
            }}
          >
            {t(availableToday ? "action.bookNow" : "action.book")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Dot() {
  return <span aria-hidden className="size-[3px] rounded-full bg-ink-200" />;
}

