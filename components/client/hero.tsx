"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

type Props = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit?: () => void;
};

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

export function Hero({ searchValue, onSearchChange, onSearchSubmit }: Props) {
  const { t } = useT();

  const titleBefore = t("hero.title.before");
  const titleEmphasis = t("hero.title.emphasis");
  const titleAfter = t("hero.title.after");

  return (
    <section
      className="relative"
      style={HERO_BG_STYLE}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-14 md:pt-20 pb-6 md:pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          <motion.h1
            variants={itemVariants}
            className="font-display font-semibold text-[44px] sm:text-[60px] md:text-[72px] lg:text-[80px] leading-[1.05] tracking-[-0.025em] text-ink-900 max-w-4xl mx-auto"
          >
            {titleBefore}
            {titleBefore ? " " : null}
            <em className="italic font-medium text-caspian-600">
              {titleEmphasis}
            </em>
            {titleAfter ? <> {titleAfter}</> : null}
          </motion.h1>

          {/* Search bar: just the free-text input + submit. Category and city
              now live in the SearchFilters card below the hero. */}
          <motion.form
            variants={itemVariants}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit?.();
            }}
            className="mt-10 md:mt-12 flex items-center h-14 w-full bg-surface border border-border-strong rounded-xl shadow-[var(--sh-1)] pl-5 pr-1.5 focus-within:border-caspian-500 focus-within:shadow-[var(--sh-focus)] transition-all"
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
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base font-medium text-ink-800 placeholder:text-ink-400 placeholder:font-normal ml-3"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="shrink-0 ml-1.5"
            >
              {t("filters.search.button")}
            </Button>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
