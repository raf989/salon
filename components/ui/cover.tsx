"use client";

import type { ReactNode } from "react";
import {
  cn,
  getGradientForId,
  getInitials,
  getProviderCoverInitials,
} from "@/lib/utils";
import type { ProviderKind } from "@/lib/types";

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
  return (
    <div
      className={cn("relative w-full overflow-hidden", aspectClass, className)}
      style={{ background: getGradientForId(id) }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight drop-shadow-sm"
          aria-label={name}
        >
          {initials}
        </span>
      </div>
      {children}
    </div>
  );
}
