"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, children }: Props) {
  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -right-24 size-[480px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, var(--saffron-200), transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-24 size-[420px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, var(--caspian-200), transparent 60%)",
          }}
        />
      </div>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 justify-center"
        >
          <span className="grid size-7 place-items-center rounded-[8px] bg-caspian-500 text-white font-display text-[14px] font-semibold">
            V
          </span>
          <span className="font-display font-semibold text-xl text-ink-900">
            Vaxt
          </span>
        </Link>
        <div className="bg-surface border border-border rounded-2xl shadow-[var(--sh-2)] p-7">
          {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink-900 leading-tight tracking-[-0.015em]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-ink-500 mt-2 text-sm">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
