"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, BadgeCheck, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { CATEGORY_LABELS, type Stylist } from "@/lib/types";
import { formatDate, getTodayISO } from "@/lib/utils";

export type ProfileCardProps = {
  me: Stylist;
};

export function ProfileCard({ me }: ProfileCardProps) {
  const { t, lang, pickLocalized } = useT();
  const firstName = me.name.split(" ")[0];
  const specialtiesLabel = me.specialties
    .map((s) => pickLocalized(CATEGORY_LABELS[s]))
    .join(" · ");
  const todayLabel = formatDate(getTodayISO(), lang);
  const verifiedLabel = lang === "ru" ? "Подтверждён" : "Doğrulandı";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden p-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-caspian-500 via-saffron-400 to-pomegranate-500"
        />

        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center min-w-0">
          <Avatar name={me.name} id={me.id} imageUrl={me.avatar} size="xl" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-caspian-600 font-semibold">
              {t("dash.eyebrowPanel")} · {todayLabel}
            </p>
            <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink-900 mt-1.5 tracking-tight">
              {t("dash.greeting")}, {firstName}
            </h1>
            <p className="text-ink-500 text-sm mt-1">
              {pickLocalized(me.city)} · {specialtiesLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 px-4 h-11 rounded-full bg-ink-50">
            <Star className="size-4 fill-saffron-400 text-saffron-400" />
            <span className="font-mono font-semibold text-ink-900">
              {me.rating}
            </span>
            <span className="text-sm text-ink-500">
              ({me.reviewsCount} {t("card.reviews")})
            </span>
          </div>
          <Badge variant="success-soft" pulse>
            {t("dash.openToday")}
          </Badge>
          <Badge variant="verified">
            <BadgeCheck className="size-3" />
            {verifiedLabel}
          </Badge>
          <Link href="/dashboard/profile" className="mt-1">
            <Button variant="outline" size="sm">
              {t("dash.profile.goTo")}
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
