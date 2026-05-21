"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Clock, MapPin, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { HeartButton } from "@/components/ui/heart-button";
import { RatingStars } from "@/components/ui/rating-stars";
import { useServices } from "@/lib/api/repo";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { getStatus } from "@/lib/get-status";
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

// Portfolio-assembly mini-collage tiles fanned out on hover. Each tile is a
// gradient square with a small icon — sells the "your booking portfolio is
// being assembled" feeling the product is going for.
const PORTFOLIO_TILES = [
  {
    icon: Sparkles,
    gradient: "from-violet-500 to-magenta-500",
    // final offsets after springing out (relative to stacked position)
    x: 56,
    y: -10,
    rotate: -8,
  },
  {
    icon: Camera,
    gradient: "from-cyan-500 to-violet-600",
    x: 100,
    y: 4,
    rotate: 6,
  },
  {
    icon: Star,
    gradient: "from-gold-500 to-magenta-500",
    x: 144,
    y: -6,
    rotate: -3,
  },
] as const;

export function ProviderRow({ provider, onBook, availableToday }: Props) {
  const { t, pickLocalized } = useT();
  const allServices = useServices();
  // Show the provider's real uploaded photo when there is one; fall back
  // to the gradient `Cover` otherwise (or if the image URL is broken).
  const [avatarFailed, setAvatarFailed] = useState(false);
  // Hover state drives the portfolio-assembly mini-collage animation. We
  // track it in React (not pure CSS) so framer-motion can apply springs
  // with stagger on the way in and on the way out.
  const [isHovered, setIsHovered] = useState(false);
  // Live availability — honors working hours, breaks AND the provider's
  // manual override (`manualStatus`). getStatus also tolerates a null/absent
  // `breaks` array, so a row with no breaks data can't crash the card.
  const now = useNow();
  const isOpen =
    getStatus(
      now,
      provider.workingHours,
      provider.breaks,
      provider.manualStatus,
    ) === "open";

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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Card className="group relative grid gap-3 md:gap-4 p-3 grid-cols-[96px_1fr] md:grid-cols-[140px_1fr_180px] items-stretch bg-surface/80 backdrop-blur-md border border-border hover:border-violet-500/40 hover:shadow-[var(--sh-glow-violet)] transition-all duration-300">
        {/* Stretched link covers the whole card — clicking anywhere outside
            an interactive child opens the profile. Inner buttons / the
            Heart toggle sit above via `relative z-10`. */}
        <Link
          href={`/provider/${provider.slug}`}
          aria-label={provider.name}
          className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caspian-500 focus-visible:ring-offset-2"
        />
        <div className="relative z-10">
          {/* Portfolio assembly collage — fans out from behind the avatar on
              hover. Sits at z-0 so the avatar (z-10) covers tiles when
              stacked, and the tiles peek out to the right when the row is
              hovered. */}
          <AnimatePresence>
            {isHovered && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 hidden md:block"
              >
                {PORTFOLIO_TILES.map((tile, i) => {
                  const Icon = tile.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 0.6,
                      }}
                      animate={{
                        opacity: 1,
                        x: tile.x,
                        y: tile.y,
                        rotate: tile.rotate,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 0.6,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                        delay: i * 0.06,
                      }}
                      className={cn(
                        "absolute left-2 top-2 size-9 rounded-md grid place-items-center bg-gradient-to-br shadow-[var(--sh-glow-violet)] ring-1 ring-white/15",
                        tile.gradient,
                      )}
                    >
                      <Icon className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
          {provider.avatar && !avatarFailed ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-2 ring-1 ring-violet-500/20 group-hover:ring-violet-500/60 transition z-10">
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
            <div className="relative rounded-xl ring-1 ring-violet-500/20 group-hover:ring-violet-500/60 transition z-10 overflow-hidden">
              <Cover
                name={provider.name}
                id={provider.id}
                kind={provider.kind}
                aspect="1"
                className="rounded-xl"
              />
            </div>
          )}
          <HeartButton
            providerId={provider.id}
            className="absolute top-1.5 right-1.5 size-9 md:size-auto md:top-2 md:right-2 z-20"
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

          <p className="text-xs md:text-sm text-ink-400 line-clamp-2">{subtitle}</p>

          {addressDetail ? (
            <div className="hidden md:flex items-center gap-1 text-sm text-ink-500 min-w-0">
              <MapPin className="size-3.5 text-violet-400/70 shrink-0" />
              <span className="truncate">{addressDetail}</span>
            </div>
          ) : null}

          {tagChips.length > 0 ? (
            <div className="hidden md:flex flex-wrap gap-1.5 mt-1">
              {tagChips.map((c) => (
                <span
                  key={c}
                  className="text-xs h-6 px-2 rounded-full bg-violet-500/12 text-violet-300 border border-violet-500/20 inline-flex items-center"
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
  return <span aria-hidden className="size-[3px] rounded-full bg-ink-400/40" />;
}

