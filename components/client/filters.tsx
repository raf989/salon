"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRICE_LABELS,
  type PriceRange,
  type ServiceCategory,
} from "@/lib/types";
import { useT, type DictKey } from "@/lib/i18n";

export type Filters = {
  search: string;
  category: ServiceCategory | "all";
  price: PriceRange | "all";
  availability: "all" | "today" | "week";
  minRating: 0 | 4;
};

export const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "all",
  price: "all",
  availability: "all",
  minRating: 0,
};

type Props = {
  value: Filters;
  onChange: (f: Filters) => void;
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ServiceCategory[];
const PRICE_KEYS = Object.keys(PRICE_LABELS) as PriceRange[];

const AVAILABILITY_OPTIONS: {
  key: Filters["availability"];
  labelKey: DictKey;
}[] = [
  { key: "all", labelKey: "filters.option.anyTime" },
  { key: "today", labelKey: "filters.option.today" },
  { key: "week", labelKey: "filters.option.week" },
];

export function Filters({ value, onChange }: Props) {
  const { t, pickLocalized } = useT();

  const isActive =
    value.search.length > 0 ||
    value.category !== "all" ||
    value.price !== "all" ||
    value.availability !== "all" ||
    value.minRating !== 0;

  const reset = () => onChange(DEFAULT_FILTERS);

  return (
    <Card className="p-4">
      {/* Category */}
      <div>
        <SectionLabel>{t("filters.label.category")}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={value.category === "all"}
            onClick={() => onChange({ ...value, category: "all" })}
          >
            {t("filters.option.all")}
          </Chip>
          {CATEGORY_KEYS.map((c) => (
            <Chip
              key={c}
              active={value.category === c}
              onClick={() => onChange({ ...value, category: c })}
            >
              {pickLocalized(CATEGORY_LABELS[c])}
            </Chip>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mt-4">
        <SectionLabel>{t("filters.label.price")}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={value.price === "all"}
            onClick={() => onChange({ ...value, price: "all" })}
          >
            {t("filters.option.anyPrice")}
          </Chip>
          {PRICE_KEYS.map((p) => (
            <Chip
              key={p}
              active={value.price === p}
              onClick={() => onChange({ ...value, price: p })}
            >
              {pickLocalized(PRICE_LABELS[p])}
            </Chip>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="mt-4">
        <SectionLabel>{t("filters.label.time")}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              active={value.availability === opt.key}
              onClick={() => onChange({ ...value, availability: opt.key })}
            >
              {t(opt.labelKey)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Rating + reset */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <SectionLabel>{t("filters.label.rating")}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={value.minRating === 4}
              onClick={() =>
                onChange({
                  ...value,
                  minRating: value.minRating === 4 ? 0 : 4,
                })
              }
            >
              {t("filters.option.rating4")}
            </Chip>
          </div>
        </div>
        {isActive ? (
          <Button variant="link" size="sm" onClick={reset}>
            {t("filters.reset")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500 mb-2">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 px-3 rounded-full text-sm font-medium border border-transparent transition-colors",
        active
          ? "bg-ink-900 text-ink-0"
          : "bg-ink-50 text-ink-700 hover:bg-ink-100",
      )}
    >
      {children}
    </button>
  );
}
