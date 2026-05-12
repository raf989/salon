"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { useT } from "@/lib/i18n";
import { KIND_LABELS, type Provider } from "@/lib/types";

type Props = {
  provider: Provider;
  availableToday: boolean;
};

// URL builders match the sidebar's logic. Kept inline here (not lifted into
// utils) because they're only used in two display surfaces and we don't want
// to grow the public API yet.
function whatsappHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function instagramHref(handle: string): string | null {
  const user = handle
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  return user ? `https://instagram.com/${encodeURIComponent(user)}` : null;
}

function tiktokHref(handle: string): string | null {
  const user = handle
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "")
    .replace(/\/+$/, "");
  return user ? `https://tiktok.com/@${encodeURIComponent(user)}` : null;
}

function telegramHref(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.length >= 10) {
    return digits ? `https://t.me/+${digits}` : null;
  }
  const user = raw
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
    .replace(/\/+$/, "");
  return user ? `https://t.me/${encodeURIComponent(user)}` : null;
}

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
      className="flex flex-col md:flex-row gap-6 items-start"
    >
      <Avatar
        name={provider.name}
        id={provider.id}
        imageUrl={provider.avatar}
        size="xl"
      />

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display font-semibold text-2xl md:text-3xl lg:text-4xl text-ink-900 tracking-[-0.015em] leading-tight">
            {provider.name}
          </h1>
          <div className="flex items-center gap-2">
            {provider.verified ? (
              <Badge variant="verified">{t("provider.verified")}</Badge>
            ) : null}
            {availableToday ? (
              <Badge variant="success-soft" pulse>
                {t("provider.freeToday")}
              </Badge>
            ) : null}
          </div>
        </div>

        <p className="text-ink-500 text-sm md:text-base">
          {sublineParts.join(" · ")}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <RatingStars value={provider.rating} size={16} />
          <b className="text-ink-900 font-mono">
            {provider.rating.toFixed(1)}
          </b>
          <span aria-hidden className="text-ink-300">
            ·
          </span>
          <span>{reviewsText}</span>
        </div>

        {hasAnyContact ? (
          <div className="flex items-center gap-2">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-grid place-items-center size-9 rounded-full bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors"
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
                className="inline-grid place-items-center size-9 rounded-full bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors"
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
                className="inline-grid place-items-center size-9 rounded-full bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors"
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
                className="inline-grid place-items-center size-9 rounded-full bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors"
              >
                <TikTokIcon className="size-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
