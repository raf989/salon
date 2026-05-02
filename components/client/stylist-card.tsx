"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, PRICE_LABELS, type Stylist } from "@/lib/types";

type Props = {
  stylist: Stylist;
  onBook: (stylist: Stylist) => void;
};

export function StylistCard({ stylist, onBook }: Props) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative h-full"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-[var(--accent)]/0 via-[var(--accent)]/0 to-[var(--accent)]/0 opacity-0 blur-md transition-opacity duration-300 group-hover:from-[var(--accent)]/20 group-hover:via-[var(--accent)]/5 group-hover:opacity-100"
      />
      <Card className="relative flex h-full flex-col overflow-hidden p-5 transition-colors duration-300 group-hover:border-white/20">
        <div className="flex items-start gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <Image
              src={stylist.avatar}
              alt={stylist.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold tracking-tight text-neutral-50">
              {stylist.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
              <MapPin className="size-3" />
              <span>{stylist.city}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs">
              <Star className="size-3.5 fill-[var(--accent)] text-[var(--accent)]" />
              <span className="font-medium text-neutral-100">
                {stylist.rating.toFixed(1)}
              </span>
              <span className="text-neutral-500">
                ({stylist.reviewsCount} rəy)
              </span>
            </div>
          </div>
          <Badge variant={stylist.priceRange === "high" ? "gold" : "default"}>
            {PRICE_LABELS[stylist.priceRange]}
          </Badge>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-neutral-400">
          {stylist.bio}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {stylist.specialties.map((s) => (
            <Badge key={s}>{CATEGORY_LABELS[s]}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="size-3.5" />
          <span>
            {stylist.workingHours.start} – {stylist.workingHours.end}
          </span>
        </div>

        <div className="mt-5 flex-1" />

        <Button
          onClick={() => onBook(stylist)}
          className="w-full"
          aria-label={`${stylist.name} ilə görüş təyin et`}
        >
          Görüş təyin et
        </Button>
      </Card>
    </motion.div>
  );
}
