"use client";

import { motion } from "framer-motion";
import { MapPin, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useT, type DictKey } from "@/lib/i18n";

export type QuickFilterKind =
  | "urgentToday"
  | "weddingTurnkey"
  | "barberHome"
  | "corporate"
  | "kidsParty";

type Props = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onQuickFilter?: (kind: QuickFilterKind) => void;
};

const QUICK_CHIPS: ReadonlyArray<{
  key: DictKey;
  kind: QuickFilterKind;
  withIcon: boolean;
}> = [
  { key: "hero.chip.urgentToday", kind: "urgentToday", withIcon: true },
  { key: "hero.chip.weddingTurnkey", kind: "weddingTurnkey", withIcon: false },
  { key: "hero.chip.barberHome", kind: "barberHome", withIcon: false },
  { key: "hero.chip.corporate", kind: "corporate", withIcon: false },
  { key: "hero.chip.kidsParty", kind: "kidsParty", withIcon: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
} as const;

const HERO_BG_STYLE = {
  background:
    "radial-gradient(60% 80% at 80% 0%, rgba(241,169,28,0.18), transparent 60%), radial-gradient(50% 70% at 0% 30%, rgba(15,133,126,0.14), transparent 60%), var(--bg)",
} as const;

export function Hero({ searchValue, onSearchChange, onQuickFilter }: Props) {
  const { t } = useT();

  const titleBefore = t("hero.title.before");
  const titleEmphasis = t("hero.title.emphasis");
  const titleAfter = t("hero.title.after");

  return (
    <section
      className="relative isolate overflow-hidden"
      style={HERO_BG_STYLE}
    >
      <div className="mx-auto max-w-7xl px-8 md:px-12 py-12 md:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col"
        >
          <motion.div variants={itemVariants} className="mb-4">
            <Eyebrow className="text-caspian-600">{t("hero.eyebrow")}</Eyebrow>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display font-semibold text-[44px] sm:text-[56px] md:text-[64px] leading-[1.05] tracking-[-0.025em] text-ink-900 max-w-3xl mb-4"
          >
            {titleBefore}
            {titleBefore ? " " : null}
            <em className="italic font-medium text-caspian-600">
              {titleEmphasis}
            </em>
            {titleAfter ? <> {titleAfter}</> : null}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg text-ink-500 max-w-xl mb-8 leading-relaxed"
          >
            {t("hero.subline")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center h-14 max-w-2xl bg-surface border border-border-strong rounded-xl shadow-[var(--sh-1)] pl-5 pr-2 gap-3 focus-within:border-caspian-500 focus-within:shadow-[var(--sh-focus)] transition-all"
          >
            <Search
              className="size-5 text-ink-400 shrink-0"
              strokeWidth={1.6}
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("hero.searchPlaceholder")}
              aria-label={t("filters.search.aria")}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base font-medium text-ink-800 placeholder:text-ink-400 placeholder:font-normal"
            />
            <span className="w-px h-7 bg-border shrink-0" aria-hidden />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 px-2 whitespace-nowrap shrink-0">
              <MapPin
                className="size-4 text-ink-400"
                strokeWidth={1.6}
              />
              {t("header.city")}
            </span>
            <Button variant="primary" size="lg" className="shrink-0">
              {t("filters.search.button")}
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-wrap gap-2"
          >
            {QUICK_CHIPS.map(({ key, kind, withIcon }) => (
              <button
                key={key}
                type="button"
                onClick={() => onQuickFilter?.(kind)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface border border-border text-sm font-medium text-ink-700 hover:bg-ink-50 hover:border-border-strong transition-colors cursor-pointer"
              >
                {withIcon ? <Zap className="size-4" strokeWidth={1.7} /> : null}
                {t(key)}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
