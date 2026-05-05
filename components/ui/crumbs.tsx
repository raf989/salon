"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };
type Props = { items: Crumb[]; className?: string };

export function Crumbs({ items, className }: Props) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-sm text-ink-400",
        className,
      )}
      aria-label="breadcrumb"
    >
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {c.href ? (
            <Link
              href={c.href}
              className="text-ink-700 hover:text-ink-900 transition-colors"
            >
              {c.label}
            </Link>
          ) : (
            <span className="text-ink-700">{c.label}</span>
          )}
          {i < items.length - 1 && <span className="text-ink-300">/</span>}
        </span>
      ))}
    </nav>
  );
}
