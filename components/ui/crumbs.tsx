"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };
type Props = { items: Crumb[]; className?: string };

export function Crumbs({ items, className }: Props) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-sm text-ink-500",
        className,
      )}
      aria-label="breadcrumb"
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {c.href ? (
              <Link
                href={c.href}
                className="text-ink-500 hover:text-violet-400 transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink-900" : "text-ink-700"}>
                {c.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="size-3.5 text-ink-400"
                aria-hidden
                strokeWidth={1.7}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
