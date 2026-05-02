"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRICE_LABELS,
  type PriceRange,
  type ServiceCategory,
} from "@/lib/types";

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
  label: string;
}[] = [
  { key: "all", label: "İstənilən vaxt" },
  { key: "today", label: "Bu gün" },
  { key: "week", label: "Bu həftə" },
];

export function Filters({ value, onChange }: Props) {
  const isActive =
    value.search.length > 0 ||
    value.category !== "all" ||
    value.price !== "all" ||
    value.availability !== "all" ||
    value.minRating !== 0;

  const reset = () => onChange(DEFAULT_FILTERS);

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            icon={<Search />}
            placeholder="Stilist və ya xidmət axtar..."
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            aria-label="Axtarış"
          />
        </div>
        {isActive ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-neutral-100 sm:self-auto"
          >
            <X className="size-3.5" />
            Filtrləri sıfırla
          </button>
        ) : null}
      </div>

      <ChipGroup label="Kateqoriya">
        <Chip
          active={value.category === "all"}
          onClick={() => onChange({ ...value, category: "all" })}
        >
          Hamısı
        </Chip>
        {CATEGORY_KEYS.map((c) => (
          <Chip
            key={c}
            active={value.category === c}
            onClick={() => onChange({ ...value, category: c })}
          >
            {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Qiymət">
        <Chip
          active={value.price === "all"}
          onClick={() => onChange({ ...value, price: "all" })}
        >
          İstənilən qiymət
        </Chip>
        {PRICE_KEYS.map((p) => (
          <Chip
            key={p}
            active={value.price === p}
            onClick={() => onChange({ ...value, price: p })}
          >
            {PRICE_LABELS[p]}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Vaxt">
        {AVAILABILITY_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            active={value.availability === opt.key}
            onClick={() => onChange({ ...value, availability: opt.key })}
          >
            {opt.label}
          </Chip>
        ))}
        <Chip
          active={value.minRating === 4}
          onClick={() =>
            onChange({ ...value, minRating: value.minRating === 4 ? 0 : 4 })
          }
        >
          4.0+ reytinq
        </Chip>
      </ChipGroup>
    </div>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 hidden text-[10px] font-medium uppercase tracking-wider text-neutral-500 sm:inline">
        {label}
      </span>
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
        "h-8 rounded-full border px-3 text-xs font-medium tracking-tight transition-all duration-200",
        active
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_0_0_1px_rgba(212,165,116,0.15),0_4px_18px_-6px_rgba(212,165,116,0.45)]"
          : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-neutral-100",
      )}
    >
      {children}
    </button>
  );
}
