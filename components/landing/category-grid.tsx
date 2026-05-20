"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/tilt-card";
import { CATEGORY_CARDS, type CategoryCard } from "@/lib/landing-data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SECTION_COPY = {
  eyebrow: { az: "Kateqoriyalar", ru: "Категории" },
  title: { az: "Öz icraçını tap", ru: "Найди своего исполнителя" },
  subtitle: {
    az: "Yüzlərlə doğrulanmış peşəkar — bir kliklə filtrlə.",
    ru: "Сотни проверенных профессионалов — фильтр в один клик.",
  },
  vendors: { az: "icraçı", ru: "исполнителей" },
};

const PARENT_VARIANTS = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type CardProps = {
  card: CategoryCard;
  span: boolean;
};

function Card({ card, span }: CardProps) {
  const { pickLocalized } = useT();
  const Icon = card.icon;
  const title = pickLocalized(card.title);
  const blurb = pickLocalized(card.blurb);

  return (
    <motion.div
      variants={ITEM_VARIANTS}
      className={cn(
        "group",
        span && "sm:col-span-2 lg:col-span-2 lg:row-span-2",
      )}
    >
      <TiltCard max={8} scale={1.015} className="h-full">
        <Link
          href={`/?kind=${card.kind}`}
          aria-label={title}
          className={cn(
            "relative block h-full overflow-hidden rounded-2xl border border-border bg-surface/60",
            "glass transition-all duration-500",
            "hover:-translate-y-1 hover:border-border-strong",
            "hover:shadow-[var(--sh-glow-violet)]",
            span ? "min-h-[260px] md:min-h-[320px]" : "min-h-[200px]",
          )}
        >
          {/* gradient sliver bg */}
          <div
            className={cn(
              "absolute inset-0 -z-10 opacity-20 blur-2xl transition-opacity duration-700",
              "bg-gradient-to-br",
              card.grad,
              "group-hover:opacity-40",
            )}
            aria-hidden
          />

          {/* shimmer line on top */}
          <div className="shimmer-line absolute inset-x-0 top-0 h-px" aria-hidden />

          {/* decorative giant icon in corner */}
          <Icon
            aria-hidden
            className={cn(
              "absolute -bottom-6 -right-6 text-ink-900/[0.04]",
              "transition-all duration-700 group-hover:text-ink-900/[0.10] group-hover:-rotate-6",
              span ? "h-56 w-56" : "h-40 w-40",
            )}
          />

          <div className="relative flex h-full flex-col gap-3 p-5 md:p-6">
            <div
              className={cn(
                "inline-flex items-center justify-center rounded-xl border border-border-strong",
                "bg-surface-2/80 backdrop-blur-sm",
                "transition-all duration-500 group-hover:scale-110",
                span ? "h-12 w-12" : "h-10 w-10",
              )}
            >
              <Icon
                className={cn(
                  "text-ink-900 transition-colors duration-500",
                  "group-hover:text-violet-300",
                  span ? "h-6 w-6" : "h-5 w-5",
                )}
                aria-hidden
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3
                className={cn(
                  "font-display font-semibold leading-tight text-ink-900",
                  span ? "text-2xl md:text-3xl" : "text-lg md:text-xl",
                )}
              >
                {title}
              </h3>
              <p
                className={cn(
                  "line-clamp-2 text-ink-500",
                  span ? "text-base" : "text-sm",
                )}
              >
                {blurb}
              </p>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 pt-3">
              <span
                aria-hidden
                className={cn(
                  "text-ink-500 transition-all duration-500",
                  "group-hover:translate-x-1 group-hover:text-violet-300",
                )}
              >
                →
              </span>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

export function CategoryGrid() {
  const { pickLocalized } = useT();

  return (
    <section
      className="relative isolate py-20 md:py-28"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 0%, rgba(155,108,246,0.08), transparent)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-3 md:items-center md:text-center">
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

        {/* Bento grid */}
        <motion.div
          variants={PARENT_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          {CATEGORY_CARDS.map((card, idx) => (
            <Card
              key={card.kind}
              card={card}
              span={idx === 0}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
