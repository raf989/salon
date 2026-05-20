"use client";

import type { ReactNode } from "react";
import {
  cn,
  getInitials,
  getProviderCoverInitials,
} from "@/lib/utils";
import type { ProviderKind } from "@/lib/types";

// Midnight Aurora gradient palette — picked deterministically by id hash so
// the same provider always shows the same cover across pages.
const AURORA_GRADIENTS = [
  "from-violet-500 via-violet-600 to-magenta-500",
  "from-magenta-500 via-magenta-600 to-gold-500",
  "from-cyan-500 via-violet-500 to-violet-700",
  "from-gold-500 via-magenta-500 to-violet-700",
  "from-violet-600 via-cyan-500 to-cyan-300",
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function gradientClassesForId(id: string): string {
  return AURORA_GRADIENTS[hashId(id) % AURORA_GRADIENTS.length];
}

type Aspect = "1" | "4/3" | "16/9";

type Props = {
  name: string;
  /** Stable id used to pick a gradient deterministically. */
  id: string;
  /** Optional kind — if provided, initials follow per-kind rules. */
  kind?: ProviderKind;
  aspect?: Aspect;
  className?: string;
  children?: ReactNode;
};

export function Cover({
  name,
  id,
  kind,
  aspect = "4/3",
  className,
  children,
}: Props) {
  const aspectClass =
    aspect === "1"
      ? "aspect-square"
      : aspect === "16/9"
        ? "aspect-video"
        : "aspect-[4/3]";
  const initials = kind
    ? getProviderCoverInitials(name, kind)
    : getInitials(name);
  const gradient = gradientClassesForId(id);
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br",
        gradient,
        aspectClass,
        className,
      )}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
          aria-label={name}
        >
          {initials}
        </span>
      </div>
      {children}
    </div>
  );
}
