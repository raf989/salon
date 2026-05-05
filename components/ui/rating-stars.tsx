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
      className={cn("inline-flex gap-0.5 text-saffron-400", className)}
      aria-label={`${value} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full ? "fill-saffron-400" : "fill-ink-100 text-ink-200"
          }
          strokeWidth={0}
        />
      ))}
    </span>
  );
}
