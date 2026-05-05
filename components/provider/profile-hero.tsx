"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { useT } from "@/lib/i18n";
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
  if (provider.responseMins !== undefined) {
    sublineParts.push(
      t("provider.respondsIn").replace("{n}", String(provider.responseMins)),
    );
  }

  const reviewsText = t("provider.reviewsCount").replace(
    "{n}",
    String(provider.reviewsCount),
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col md:flex-row gap-6 items-start"
    >
      <Avatar name={provider.name} id={provider.id} imageUrl={provider.avatar} size="2xl" />

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink-900 tracking-[-0.015em] leading-tight">
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
          <span aria-hidden className="text-ink-300">
            ·
          </span>
          <span>{t("provider.reliability")} 99%</span>
        </div>
      </div>
    </motion.section>
  );
}
