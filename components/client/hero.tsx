"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CitySelector } from "@/components/ui/city-selector";
import { SelectMenu } from "@/components/ui/select-menu";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { KIND_LABELS, type ProviderKind } from "@/lib/types";

type Props = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit?: () => void;
  kindFilter: ProviderKind | null;
  onKindChange: (kind: ProviderKind | null) => void;
};

const KIND_OPTIONS: ProviderKind[] = [
  "photographer",
  "dj",
  "host",
  "restaurant",
  "barber",
  "salon",
  "makeup",
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

export function Hero({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  kindFilter,
  onKindChange,
}: Props) {
  const { t } = useT();

  const titleBefore = t("hero.title.before");
  const titleEmphasis = t("hero.title.emphasis");
  const titleAfter = t("hero.title.after");

  return (
    <section
      className="relative"
      style={HERO_BG_STYLE}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-12 py-16 md:py-24">
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

          <motion.form
            variants={itemVariants}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit?.();
            }}
            className="mt-10 md:mt-12 flex items-center h-14 w-full max-w-2xl mx-auto bg-surface border border-border-strong rounded-xl shadow-[var(--sh-1)] pl-3 pr-1.5 focus-within:border-caspian-500 focus-within:shadow-[var(--sh-focus)] transition-all"
          >
            {/* 1 — Category */}
            <div className="flex items-center shrink-0 px-2">
              <CategoryDropdown
                value={kindFilter}
                onChange={onKindChange}
              />
            </div>
            <Divider />

            {/* 2 — Location (hidden on mobile; city is also in the header) */}
            <div className="hidden sm:flex items-center shrink-0 px-2">
              <CitySelector variant="inline" align="left" />
            </div>
            <Divider className="hidden sm:block" />

            {/* 3 — Free-text input */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-3">
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
            </div>

            {/* 4 — Submit */}
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

function Divider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("w-px h-7 bg-border shrink-0", className)}
    />
  );
}

function CategoryDropdown({
  value,
  onChange,
}: {
  value: ProviderKind | null;
  onChange: (k: ProviderKind | null) => void;
}) {
  const { t, lang, pickLocalized } = useT();

  const options = useMemo(
    () =>
      KIND_OPTIONS.map((k) => ({
        value: k,
        label: pickLocalized(KIND_LABELS[k]),
      })),
    [pickLocalized],
  );

  return (
    <SelectMenu
      value={value}
      onChange={(v) => onChange((v as ProviderKind | null) ?? null)}
      options={options}
      allOptionLabel={lang === "ru" ? "Все категории" : "Hamısı"}
      triggerVariant="inline"
      triggerIcon={<LayoutGrid className="size-4 text-ink-400" />}
      triggerPlaceholder={t("filters.label.category")}
      searchPlaceholder={
        lang === "ru" ? "Поиск категории…" : "Kateqoriya axtar…"
      }
      emptyLabel={lang === "ru" ? "Ничего не найдено" : "Heç nə tapılmadı"}
      align="left"
    />
  );
}
