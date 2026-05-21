"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Sparkles, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useT } from "@/lib/i18n";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

// Deterministic-ish sparkle positions so SSR/CSR match. We seed with a
// small hand-tuned set rather than Math.random in the render body.
const SPARKLES: Array<{ left: string; top: string; delay: number; size: number }> = [
  { left: "8%", top: "12%", delay: 0, size: 6 },
  { left: "22%", top: "78%", delay: 0.4, size: 4 },
  { left: "35%", top: "30%", delay: 0.8, size: 5 },
  { left: "48%", top: "65%", delay: 1.2, size: 3 },
  { left: "62%", top: "18%", delay: 0.2, size: 7 },
  { left: "70%", top: "82%", delay: 0.6, size: 4 },
  { left: "82%", top: "48%", delay: 1.0, size: 5 },
  { left: "90%", top: "22%", delay: 1.4, size: 3 },
  { left: "15%", top: "55%", delay: 0.3, size: 4 },
  { left: "55%", top: "8%", delay: 0.9, size: 5 },
  { left: "78%", top: "70%", delay: 1.1, size: 4 },
  { left: "42%", top: "92%", delay: 0.5, size: 3 },
];

export function AuthShell({ eyebrow, title, subtitle, children }: Props) {
  const { pickLocalized } = useT();

  const quote = useMemo(
    () =>
      pickLocalized({
        az: "Vaxtını idarə et.",
        ru: "Управляй своим временем.",
      }),
    [pickLocalized],
  );

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden flex items-stretch justify-center px-4 py-8 md:py-12">
      {/* Background aurora glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -right-24 size-[520px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--caspian-500), transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-32 size-[480px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--magenta-500), transparent 60%)",
          }}
        />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-stretch">
        {/* Form column */}
        <div className="md:col-span-2 flex flex-col">
          <Link
            href="/"
            className="flex items-center gap-2 mb-6 md:mb-8 justify-center md:justify-start"
          >
            <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-violet-500 via-magenta-500 to-violet-600 text-white font-display text-[15px] font-semibold italic shadow-[var(--sh-glow-violet)]">
              B
            </span>
            <span className="font-display font-semibold text-xl text-ink-900 gradient-text-aurora">
              BRONELE
            </span>
          </Link>
          <div className="glass-strong rounded-2xl p-7 md:p-8 flex-1 flex flex-col">
            {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
            <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink-900 leading-tight tracking-[-0.015em]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-ink-500 mt-2 text-sm">{subtitle}</p>
            ) : null}
            <div className="mt-6 flex-1">{children}</div>
          </div>
        </div>

        {/* Decorative right column — hidden on mobile */}
        <div className="hidden md:col-span-3 md:flex relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-magenta-600 to-violet-900" />
          {/* Subtle vignette */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-60 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(120% 120% at 20% 10%, rgba(255,255,255,0.18), transparent 60%)",
            }}
          />

          {/* Sparkles */}
          {SPARKLES.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full bg-white"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                boxShadow: "0 0 12px rgba(255,255,255,0.85)",
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -20, -40],
              }}
              transition={{
                duration: 4 + (i % 3),
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Floating glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute top-[14%] left-[8%] w-[58%] glass rounded-2xl p-4 float-y"
            style={{ animationDelay: "-1s" }}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[var(--sh-glow-cyan)]" />
              <div className="flex-1 min-w-0">
                <div className="h-2.5 w-24 rounded-full bg-white/70" />
                <div className="mt-1.5 h-2 w-16 rounded-full bg-white/40" />
              </div>
              <div className="flex items-center gap-1 text-gold-300">
                <Star className="size-3.5 fill-current" />
                <span className="text-xs font-semibold text-white">4.9</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="absolute top-[38%] right-[6%] w-[44%] glass rounded-2xl p-4 float-y"
            style={{ animationDelay: "-2.4s" }}
          >
            <div className="flex items-center gap-2 text-white mb-2.5">
              <CalendarDays className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {pickLocalized({ az: "Bu gün", ru: "Сегодня" })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-6 rounded-md ${
                    i === 2 || i === 4
                      ? "bg-gradient-to-br from-magenta-400 to-violet-500"
                      : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute bottom-[12%] left-[14%] glass rounded-2xl px-4 py-3 float-y"
            style={{ animationDelay: "-3.8s" }}
          >
            <div className="flex items-center gap-1.5 text-gold-300">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
              <span className="ml-1.5 text-xs font-semibold text-white">
                {pickLocalized({ az: "Əla", ru: "Отлично" })}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="absolute bottom-[28%] right-[14%] glass rounded-xl px-3 py-2 flex items-center gap-2 float-y"
            style={{ animationDelay: "-1.6s" }}
          >
            <Sparkles className="size-3.5 text-cyan-300" />
            <span className="text-[11px] font-medium text-white">
              {pickLocalized({ az: "12 saniyəyə rezerv", ru: "Бронь за 12 сек" })}
            </span>
          </motion.div>

          {/* Quote overlay. Extra bottom padding lifts the quote clear of
              the floating "Отлично" rating card (bottom-[12%]). */}
          <div className="relative z-10 flex items-end p-8 md:p-10 lg:p-12 pb-24 md:pb-28 lg:pb-36 w-full">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-display font-semibold text-4xl lg:text-5xl text-white leading-[1.05] tracking-[-0.025em] max-w-md drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]"
            >
              {quote}
            </motion.h2>
          </div>
        </div>
      </div>
    </main>
  );
}
