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
 * BRONELE brand mark — animated rounded square with a violet→magenta→cyan
 * gradient fill, holographic conic shimmer, and a stylized italic "B".
 * The full variant adds the Fraunces italic wordmark with the aurora
 * gradient.
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
      aria-label="BRONELE"
    >
      <Mark size={s.mark} animated={animated} />
      {variant === "full" ? (
        <span
          className={cn(
            "font-display font-semibold italic tracking-[-0.02em] leading-none",
            s.text,
          )}
        >
          <span className="gradient-text-aurora">BRONELE</span>
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
      {/* SVG "B" inside the plate */}
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="bronele-b-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF87C8" />
            <stop offset="55%" stopColor="#9B6CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        {/* Italic "B" glyph — mirrors the Fraunces italic wordmark */}
        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="25"
          fontStyle="italic"
          fontWeight="700"
          fill="url(#bronele-b-grad)"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          B
        </text>
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
          <circle cx="30" cy="11" r="1.4" fill="#FFCE5A" />
        </motion.g>
      </svg>
    </span>
  );
}
