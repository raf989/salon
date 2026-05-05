"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { className?: string; children: ReactNode };

export function Eyebrow({ className, children }: Props) {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.18em] text-caspian-600",
        className,
      )}
    >
      {children}
    </div>
  );
}
