"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  size?: number;
  className?: string;
};

export function RatingStars({ value, size = 14, className }: Props) {
  const full = Math.round(value);
  return (
    <span
      className={cn("inline-flex gap-0.5 text-gold-500", className)}
      aria-label={`${value} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < full
              ? "fill-gold-500 text-gold-500 drop-shadow-[0_0_4px_rgba(255,176,0,0.4)]"
              : "fill-ink-300/40 text-ink-300",
          )}
          strokeWidth={0}
        />
      ))}
    </span>
  );
}
