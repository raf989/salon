"use client";

import { motion } from "framer-motion";
import { Check, MessageCircle, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { useT } from "@/lib/i18n";
import {
  instagramHref,
  telegramHref,
  tiktokHref,
  whatsappHref,
} from "@/lib/contact-urls";
import { KIND_LABELS, type Provider } from "@/lib/types";

type Props = {
  provider: Provider;
  availableToday: boolean;
};

export function ProfileHero({ provider, availableToday }: Props) {
  const { t, pickLocalized } = useT();

  const kindLabel = pickLocalized(KIND_LABELS[provider.kind]);
  const district = provider.district
    ? pickLocalized(provider.district)
    : pickLocalized(provider.city);

  const sublineParts: string[] = [kindLabel];
  if (provider.experienceYears !== undefined) {
    sublineParts.push(
      `${provider.experienceYears} ${t("provider.experienceYears")}`,
    );
  }
  sublineParts.push(district);

  const reviewsText = t("provider.reviewsCount").replace(
    "{n}",
    String(provider.reviewsCount),
  );

  const waRaw = provider.whatsapp || provider.phones?.[0] || "";
  const waHref = waRaw ? whatsappHref(waRaw) : null;
  const tgRaw =
    provider.telegram || provider.whatsapp || provider.phones?.[0] || "";
  const tgHref = tgRaw ? telegramHref(tgRaw) : null;
  const igHref = provider.instagram ? instagramHref(provider.instagram) : null;
  const ttHref = provider.tiktok ? tiktokHref(provider.tiktok) : null;
  const hasAnyContact = Boolean(waHref || tgHref || igHref || ttHref);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong rounded-2xl border border-border-strong p-5 sm:p-6 md:p-7 relative overflow-hidden"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(155,108,246,0.20), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start text-center md:text-left">
        <div className="relative shrink-0">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-violet-500/60 ring-offset-2 ring-offset-bg shadow-[var(--sh-glow-violet)]"
          />
          <Avatar
            name={provider.name}
            id={provider.id}
            imageUrl={provider.avatar}
            size="xl"
          />
          {availableToday ? (
            <motion.span
              aria-label={t("provider.freeToday")}
              animate={{ scale: [1, 1.18, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1 right-1 size-3.5 rounded-full bg-success-500 ring-2 ring-bg shadow-[var(--sh-glow-cyan)]"
            />
          ) : null}
        </div>

        <div className="flex-1 flex flex-col gap-2.5 md:gap-3 min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 min-w-0">
            <h1 className="font-display font-semibold text-[26px] md:text-3xl lg:text-4xl text-ink-900 tracking-[-0.015em] leading-tight break-words min-w-0">
              {provider.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {provider.verified ? (
                <span
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold text-ink-900 glow-gold bg-gradient-to-br from-gold-500 via-gold-600 to-magenta-500"
                  title={t("provider.verified")}
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                  {t("provider.verified")}
                </span>
              ) : null}
              {availableToday ? (
                <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-success-500/15 border border-success-500/30 text-success-500 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-success-500 animate-pulse" />
                  {t("provider.freeToday")}
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-ink-500 text-sm md:text-base">
            {sublineParts.join(" · ")}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-ink-500">
            <span className="text-gold-400 inline-flex">
              <RatingStars value={provider.rating} size={16} />
            </span>
            <AnimatedCounter
              to={Math.round(provider.rating * 10)}
              format={(v) => (v / 10).toFixed(1)}
              className="text-ink-900 font-mono font-semibold"
            />
            <span aria-hidden className="text-ink-400">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 text-gold-400" strokeWidth={2} />
              {reviewsText}
            </span>
          </div>

          {hasAnyContact ? (
            <div className="flex items-center justify-center md:justify-start gap-2">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="inline-grid place-items-center size-11 md:size-9 rounded-full bg-surface-2/80 border border-border-strong text-ink-700 hover:text-ink-900 hover:border-violet-500/60 hover:shadow-[var(--sh-glow-violet)] transition-all"
                >
                  <MessageCircle className="size-4" />
                </a>
              ) : null}
              {tgHref ? (
                <a
                  href={tgHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="inline-grid place-items-center size-11 md:size-9 rounded-full bg-surface-2/80 border border-border-strong text-ink-700 hover:text-ink-900 hover:border-violet-500/60 hover:shadow-[var(--sh-glow-violet)] transition-all"
                >
                  <TelegramIcon className="size-4" />
                </a>
              ) : null}
              {igHref ? (
                <a
                  href={igHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-grid place-items-center size-11 md:size-9 rounded-full bg-surface-2/80 border border-border-strong text-ink-700 hover:text-ink-900 hover:border-violet-500/60 hover:shadow-[var(--sh-glow-violet)] transition-all"
                >
                  <InstagramIcon className="size-4" />
                </a>
              ) : null}
              {ttHref ? (
                <a
                  href={ttHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-grid place-items-center size-11 md:size-9 rounded-full bg-surface-2/80 border border-border-strong text-ink-700 hover:text-ink-900 hover:border-violet-500/60 hover:shadow-[var(--sh-glow-violet)] transition-all"
                >
                  <TikTokIcon className="size-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
