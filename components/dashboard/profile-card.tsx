"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, type Stylist } from "@/lib/types";

export type ProfileCardProps = {
  me: Stylist;
};

export function ProfileCard({ me }: ProfileCardProps) {
  const firstName = me.name.split(" ")[0];
  const specialtiesLabel = me.specialties
    .map((s) => CATEGORY_LABELS[s])
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_0%,rgba(212,165,116,0.12),transparent_55%)]"
        />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-[var(--accent)]/30 shadow-[0_0_0_4px_rgba(212,165,116,0.08)] sm:size-20">
              <Image
                src={me.avatar}
                alt={me.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-100 sm:text-2xl">
                Salam, {firstName}!
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-[var(--accent)]" />
                  {me.city}
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-300">{specialtiesLabel}</span>
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
              <Star className="size-3.5 fill-[var(--accent)]" />
              <span>{me.rating.toFixed(1)}</span>
              <span className="text-[var(--accent)]/70">·</span>
              <span className="text-[var(--accent)]/90">
                {me.reviewsCount} rəy
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
