"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { className?: string; children: ReactNode };

export function Eyebrow({ className, children }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-magenta-500 animate-pulse"
      />
      {children}
    </div>
  );
}
