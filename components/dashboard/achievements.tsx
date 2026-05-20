"use client";

import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Lock,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Accent = "gold" | "violet" | "magenta" | "cyan";

type Achievement = {
  icon: LucideIcon;
  labelKey: DictKey;
  accent: Accent;
  unlocked: boolean;
};

const ACHIEVEMENTS: Achievement[] = [
  { icon: Star, labelKey: "dash.ach.first", accent: "gold", unlocked: true },
  { icon: Award, labelKey: "dash.ach.ten", accent: "violet", unlocked: true },
  {
    icon: Sparkles,
    labelKey: "dash.ach.fiveStar",
    accent: "magenta",
    unlocked: true,
  },
  {
    icon: Trophy,
    labelKey: "dash.ach.hundred",
    accent: "cyan",
    unlocked: false,
  },
  {
    icon: Calendar,
    labelKey: "dash.ach.year",
    accent: "violet",
    unlocked: false,
  },
];

const ACCENT_GRADIENT: Record<Accent, string> = {
  gold: "from-gold-500 to-gold-600",
  violet: "from-violet-500 to-magenta-500",
  magenta: "from-magenta-500 to-magenta-600",
  cyan: "from-cyan-500 to-violet-500",
};

const ACCENT_GLOW: Record<Accent, string> = {
  gold: "shadow-[var(--sh-glow-gold)]",
  violet: "shadow-[var(--sh-glow-violet)]",
  magenta: "shadow-[var(--sh-glow-magenta)]",
  cyan: "shadow-[var(--sh-glow-cyan)]",
};

export function Achievements() {
  const { t } = useT();
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const total = ACHIEVEMENTS.length;

  return (
    <div className="glass-strong border border-border rounded-2xl p-5 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-12 size-32 rounded-full bg-gold-500/15 blur-3xl"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-ink-900 text-lg leading-tight">
            {t("dash.ach.title")}
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            {t("dash.ach.progress")
              .replace("{n}", String(unlocked))
              .replace("{total}", String(total))}
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
        {ACHIEVEMENTS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.li
              key={String(a.labelKey)}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center text-center"
            >
              <div
                className={cn(
                  "relative size-12 rounded-full grid place-items-center",
                  "bg-gradient-to-br",
                  ACCENT_GRADIENT[a.accent],
                  a.unlocked
                    ? ACCENT_GLOW[a.accent]
                    : "opacity-30 grayscale",
                )}
              >
                <Icon className="size-5 text-white" />
                {!a.unlocked ? (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 size-5 grid place-items-center rounded-full bg-bg border border-border-strong"
                  >
                    <Lock className="size-2.5 text-ink-500" />
                  </span>
                ) : null}
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] sm:text-[11px] leading-tight",
                  a.unlocked
                    ? "text-ink-700 font-medium"
                    : "text-ink-500",
                )}
              >
                {t(a.labelKey)}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
