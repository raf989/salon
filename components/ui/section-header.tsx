"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  right?: ReactNode;
};

export function SectionHeader({
  title,
  href,
  linkLabel,
  className,
  right,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 mb-4",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink-900 leading-tight">
          {title}
        </h2>
        <span
          aria-hidden
          className="h-px w-12 bg-gradient-to-r from-violet-500 to-magenta-500"
        />
      </div>
      {right ??
        (href && linkLabel && (
          <Link
            href={href}
            className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            {linkLabel}
          </Link>
        ))}
    </div>
  );
}
