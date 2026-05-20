"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, MousePointer2, Star, Check } from "lucide-react";
import { HOW_STEPS, type HowStep } from "@/lib/landing-data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SECTION_COPY = {
  eyebrow: { az: "Necə işləyir", ru: "Как это работает" },
  title: { az: "Üç addım — bitdi", ru: "Три шага — и всё" },
  subtitle: {
    az: "Axtarışdan rezervə qədər orta hesabla 4 dəqiqə.",
    ru: "От поиска до брони — в среднем 4 минуты.",
  },
};

const ACCENT: Record<HowStep["accent"], { text: string; glow: string; ring: string; chip: string }> = {
  violet: {
    text: "text-violet-300",
    glow: "shadow-[var(--sh-glow-violet)]",
    ring: "border-violet-500/40",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  magenta: {
    text: "text-magenta-300",
    glow: "shadow-[var(--sh-glow-magenta)]",
    ring: "border-magenta-500/40",
    chip: "bg-magenta-500/15 text-magenta-300 border-magenta-500/30",
  },
  cyan: {
    text: "text-cyan-300",
    glow: "shadow-[var(--sh-glow-cyan)]",
    ring: "border-cyan-500/40",
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
};

const PARENT_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─── Step 1: Search bar with typing animation ─────────────────────────────
function SearchDemo() {
  const { pickLocalized } = useT();
  const placeholder = pickLocalized({ az: "Axtar…", ru: "Искать…" });
  const queries = useMemo(
    () => [
      pickLocalized({ az: "fotoqraf", ru: "фотограф" }),
      pickLocalized({ az: "DJ Bakı", ru: "DJ Баку" }),
      pickLocalized({ az: "vizajist", ru: "визажист" }),
    ],
    [pickLocalized],
  );

  const [qIdx, setQIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "deleting">("typing");

  useEffect(() => {
    const current = queries[qIdx];
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 80);
      } else {
        timer = setTimeout(() => setPhase("hold"), 900);
      }
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("deleting"), 600);
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, -1)), 40);
      } else {
        timer = setTimeout(() => {
          setQIdx((i) => (i + 1) % queries.length);
          setPhase("typing");
        }, 250);
      }
    }
    return () => clearTimeout(timer);
  }, [text, phase, qIdx, queries]);

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg/60 px-3 py-2 backdrop-blur-sm">
        <Search className="h-4 w-4 text-violet-300" aria-hidden />
        <div className="flex-1 text-sm text-ink-700">
          {text}
          <span className="ml-px inline-block h-4 w-px animate-pulse bg-violet-300 align-middle" />
          {text.length === 0 && (
            <span className="text-ink-500/70">{placeholder}</span>
          )}
        </div>
      </div>
      {/* simulated cursor */}
      <motion.div
        aria-hidden
        className="absolute"
        initial={{ x: 20, y: 60, opacity: 0 }}
        animate={{ x: [20, 180, 180], y: [60, 28, 28], opacity: [0, 1, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6 }}
      >
        <MousePointer2 className="h-4 w-4 -rotate-12 fill-violet-300 text-violet-300 drop-shadow-[0_0_8px_rgba(155,108,246,0.7)]" />
      </motion.div>
    </div>
  );
}

// ─── Step 2: Calendar grid with cursor selecting a slot ───────────────────
function CalendarDemo() {
  const days = Array.from({ length: 14 }, (_, i) => i + 7);
  const targetIdx = 4; // highlighted slot

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, idx) => {
          const isTarget = idx === targetIdx;
          return (
            <motion.div
              key={d}
              className={cn(
                "flex h-7 items-center justify-center rounded-md border text-xs font-mono",
                isTarget
                  ? "border-magenta-500/40 bg-magenta-500/10 text-magenta-300"
                  : "border-border bg-bg/50 text-ink-500",
              )}
              animate={
                isTarget
                  ? {
                      borderColor: [
                        "rgba(232,90,160,0.4)",
                        "rgba(232,90,160,1)",
                        "rgba(232,90,160,0.4)",
                      ],
                      boxShadow: [
                        "0 0 0 rgba(232,90,160,0)",
                        "0 0 16px rgba(232,90,160,0.6)",
                        "0 0 0 rgba(232,90,160,0)",
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.2 }}
            >
              {d}
            </motion.div>
          );
        })}
      </div>
      {/* simulated cursor lands on target slot */}
      <motion.div
        aria-hidden
        className="absolute left-0 top-0"
        initial={{ x: 10, y: 80, opacity: 0 }}
        animate={{
          x: [10, 84, 84],
          y: [80, 28, 28],
          opacity: [0, 1, 1],
          scale: [1, 1, 0.85],
        }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4 }}
      >
        <MousePointer2 className="h-4 w-4 -rotate-12 fill-magenta-300 text-magenta-300 drop-shadow-[0_0_8px_rgba(232,90,160,0.7)]" />
      </motion.div>
    </div>
  );
}

// ─── Step 3: Stars fill one-by-one, then toast pops up ────────────────────
function ReviewDemo() {
  const { pickLocalized } = useT();
  const thanksLabel = pickLocalized({
    az: "Rəyin üçün təşəkkürlər",
    ru: "Спасибо за отзыв",
  });

  const [filled, setFilled] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const tick = () => {
      setFilled(0);
      setShowToast(false);
      const steps = [400, 700, 1000, 1300, 1600];
      const timers = steps.map((delay, i) =>
        setTimeout(() => setFilled(i + 1), delay),
      );
      const toastIn = setTimeout(() => setShowToast(true), 2000);
      const toastOut = setTimeout(() => setShowToast(false), 3400);
      return () => {
        timers.forEach(clearTimeout);
        clearTimeout(toastIn);
        clearTimeout(toastOut);
      };
    };
    const cleanup = tick();
    const loop = setInterval(() => {
      cleanup();
      tick();
    }, 4200);
    return () => {
      cleanup();
      clearInterval(loop);
    };
  }, []);

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex h-full items-center justify-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={
              i < filled
                ? { scale: [0.7, 1.25, 1], rotate: [0, 8, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors duration-300",
                i < filled
                  ? "fill-gold-400 text-gold-400 drop-shadow-[0_0_8px_rgba(245,193,90,0.6)]"
                  : "fill-transparent text-ink-500/40",
              )}
              aria-hidden
            />
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute bottom-3 left-1/2 -translate-x-1/2",
              "inline-flex items-center gap-1.5 rounded-full",
              "border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5",
              "text-xs font-medium text-cyan-300 shadow-[var(--sh-glow-cyan)]",
            )}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            {thanksLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DEMOS = [SearchDemo, CalendarDemo, ReviewDemo] as const;

export function HowItWorks() {
  const { pickLocalized } = useT();

  return (
    <section className="relative isolate py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-14 flex flex-col items-start gap-3 md:items-center md:text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-magenta-500 animate-pulse"
            />
            {pickLocalized(SECTION_COPY.eyebrow)}
          </span>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-900 md:text-5xl">
            <span className="gradient-text-aurora">
              {pickLocalized(SECTION_COPY.title)}
            </span>
          </h2>
          <p className="max-w-xl text-base text-ink-500 md:text-lg">
            {pickLocalized(SECTION_COPY.subtitle)}
          </p>
        </div>

        <motion.div
          variants={PARENT_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6"
        >
          {HOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const Demo = DEMOS[idx];
            const accent = ACCENT[step.accent];
            return (
              <motion.div
                key={idx}
                variants={ITEM_VARIANTS}
                className="relative"
              >
                {/* connector line (desktop only, between cards) */}
                {idx < HOW_STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-full top-12 hidden h-px w-[calc(theme(spacing.6))] -translate-x-1/2 md:block"
                  >
                    <div className="relative h-px w-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/40 via-magenta-500/40 to-cyan-500/40" />
                      <motion.div
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          delay: idx * 0.4,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "glass relative h-full overflow-hidden rounded-2xl border border-border p-5 md:p-6",
                    "transition-all duration-500 hover:border-border-strong",
                  )}
                >
                  <div className="shimmer-line absolute inset-x-0 top-0 h-px" aria-hidden />

                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "inline-flex h-12 w-12 items-center justify-center rounded-full",
                        "border bg-surface-2/80 backdrop-blur",
                        accent.ring,
                        accent.glow,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", accent.text)} aria-hidden />
                    </div>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-xs",
                        accent.chip,
                      )}
                    >
                      {String(idx + 1).padStart(2, "0")} / 03
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-semibold text-ink-900 md:text-2xl">
                    {pickLocalized(step.title)}
                  </h3>
                  <p className="mt-2 text-sm text-ink-500 md:text-base">
                    {pickLocalized(step.body)}
                  </p>

                  {/* mini-demo */}
                  <div className="mt-5 hidden md:block">
                    <Demo />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
