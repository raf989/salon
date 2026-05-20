"use client";

import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";
import { useT, type DictKey } from "@/lib/i18n";
import { cn, formatPrice } from "@/lib/utils";

// Mock data — last 7 days, anchored Mon→Sun. Replace with live aggregate
// once analytics endpoint lands.
const DAYS: { dictIdx: 0 | 1 | 2 | 3 | 4 | 5 | 6; value: number }[] = [
  { dictIdx: 1, value: 320 }, // Mon
  { dictIdx: 2, value: 480 }, // Tue
  { dictIdx: 3, value: 240 }, // Wed
  { dictIdx: 4, value: 580 }, // Thu
  { dictIdx: 5, value: 720 }, // Fri
  { dictIdx: 6, value: 460 }, // Sat
  { dictIdx: 0, value: 380 }, // Sun
];

export function EarningsChart() {
  const { t } = useT();
  const total = DAYS.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...DAYS.map((d) => d.value));

  return (
    <div className="glass-strong border border-border rounded-2xl p-5 relative overflow-hidden">
      {/* Aurora wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-violet-500/15 blur-3xl"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-ink-900 text-lg leading-tight">
            {t("dash.earnings.title")}
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            {t("dash.earnings.sub")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-500">
            {t("dash.earnings.total")}
          </div>
          <div className="font-display text-xl mt-1 gradient-text-aurora">
            {formatPrice(total)}
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="mt-5 flex items-end justify-between gap-2 h-40">
        {DAYS.map((d, i) => {
          const heightPct = max > 0 ? (d.value / max) * 100 : 0;
          const label = t(`weekday.short.${d.dictIdx}` as DictKey);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex-1 flex items-end">
                <Tooltip content={formatPrice(d.value)}>
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -4 }}
                    style={{
                      height: `${Math.max(8, heightPct)}%`,
                      transformOrigin: "bottom",
                    }}
                    className={cn(
                      "w-full max-w-[28px] mx-auto rounded-t-md",
                      "bg-gradient-to-t from-violet-500 to-magenta-500",
                      "shadow-[var(--sh-glow-violet)]",
                      "cursor-pointer",
                    )}
                  />
                </Tooltip>
              </div>
              <span className="text-[11px] text-ink-500 font-mono">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
