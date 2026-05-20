"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE = {
  sm: { mark: 22, gap: 8,  text: "text-base"   },
  md: { mark: 28, gap: 10, text: "text-lg"     },
  lg: { mark: 36, gap: 12, text: "text-xl"     },
  xl: { mark: 52, gap: 16, text: "text-3xl"    },
} as const;

type Props = {
  size?: Size;
  variant?: "full" | "mark";
  animated?: boolean;
  className?: string;
};

/**
 * Vaxt brand mark — animated rounded square with a violet→magenta→cyan
 * gradient fill, holographic conic shimmer, and a stylized "V" cut-out
 * that doubles as a clock-hand reference (Vaxt = "time" in AZ). The full
 * variant adds the Fraunces italic wordmark with the aurora gradient.
 */
export function Logo({
  size = "md",
  variant = "full",
  animated = true,
  className,
}: Props) {
  const s = SIZE[size];
  return (
    <span
      className={cn(
        "inline-flex items-center select-none",
        className,
      )}
      style={{ gap: s.gap }}
      aria-label="Vaxt"
    >
      <Mark size={s.mark} animated={animated} />
      {variant === "full" ? (
        <span
          className={cn(
            "font-display font-semibold italic tracking-[-0.02em] leading-none",
            s.text,
          )}
        >
          <span className="gradient-text-aurora">Vaxt</span>
        </span>
      ) : null}
    </span>
  );
}

function Mark({ size, animated }: { size: number; animated: boolean }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Soft outer glow */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[28%] blur-md opacity-70"
        style={{
          background:
            "conic-gradient(from 0deg, #FF3D9D, #9B6CF6, #22D3EE, #FF3D9D)",
        }}
      />
      {/* Rotating holographic ring (background layer) */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-[28%]"
        style={{
          background:
            "conic-gradient(from 0deg, #FF3D9D, #9B6CF6, #22D3EE, #FFB000, #FF3D9D)",
        }}
        animate={animated ? { rotate: 360 } : undefined}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner dark plate — sits on top of the ring, leaving a 1-2px halo */}
      <span
        aria-hidden
        className="absolute rounded-[26%] bg-bg"
        style={{ inset: Math.max(1, size * 0.06) }}
      />
      {/* SVG "V" inside the plate */}
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="vaxt-v-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF87C8" />
            <stop offset="55%" stopColor="#9B6CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="vaxt-v-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* V strokes — two rounded lines forming a chevron */}
        <path
          d="M 11 12 L 20 28 L 29 12"
          stroke="url(#vaxt-v-grad)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Subtle highlight along top of the V */}
        <path
          d="M 11 12 L 20 28 L 29 12"
          stroke="url(#vaxt-v-glow)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.7"
        />
        {/* Sparkle accent at top-right */}
        <motion.g
          animate={
            animated
              ? { opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }
              : undefined
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "30px 12px" }}
        >
          <circle cx="30" cy="12" r="1.4" fill="#FFCE5A" />
        </motion.g>
      </svg>
    </span>
  );
}
