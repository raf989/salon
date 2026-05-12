"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT, type DictKey } from "@/lib/i18n";
import { ALL_CITIES_ID, CITIES } from "@/lib/cities";
import { KIND_LABELS, type ProviderKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SortKey =
  | "actuality"
  | "rating"
  | "cheap"
  | "expensive"
  | "popular";

export type SearchFiltersValue = {
  category: ProviderKind | "all";
  cityId: string;     // "all" or city id
  districtId: string; // "all" or district label
  priceMin: string;
  priceMax: string;
};

export const SORT_OPTIONS: ReadonlyArray<{
  value: SortKey;
  labelKey: DictKey;
}> = [
  { value: "actuality", labelKey: "search.sort.actuality" },
  { value: "rating", labelKey: "search.sort.rating" },
  { value: "cheap", labelKey: "search.sort.cheap" },
  { value: "expensive", labelKey: "search.sort.expensive" },
  { value: "popular", labelKey: "search.sort.popular" },
];

const KIND_OPTIONS: ReadonlyArray<ProviderKind> = [
  "photographer",
  "dj",
  "host",
  "restaurant",
  "barber",
  "salon",
  "makeup",
];

type Props = {
  value: SearchFiltersValue;
  onChange: (next: SearchFiltersValue) => void;
  /** Districts available for the currently selected city (already de-duped). */
  districts: string[];
  /** Click handler for the action button (e.g. scroll to results). */
  onShow?: () => void;
};

export function SearchFilters({ value, onChange, districts, onShow }: Props) {
  const { t, lang, pickLocalized } = useT();

  const set = <K extends keyof SearchFiltersValue>(
    key: K,
    v: SearchFiltersValue[K],
  ) => onChange({ ...value, [key]: v });

  // Build label maps — listed alphabetically by their visible label per locale
  // so the dropdowns match what the user reads.
  const categoryOptions = useMemo(() => {
    const opts: Option[] = [
      { value: "all", label: t("search.placeholder.specialist") },
      ...KIND_OPTIONS.map((k) => ({
        value: k,
        label: pickLocalized(KIND_LABELS[k]),
      })),
    ];
    // keep "all" pinned, sort the rest
    const head = opts[0];
    const tail = opts.slice(1).sort((a, b) =>
      a.label.localeCompare(b.label, lang, { sensitivity: "base" }),
    );
    return [head, ...tail];
  }, [t, lang, pickLocalized]);

  const cityOptions = useMemo<Option[]>(() => {
    const all: Option = {
      value: ALL_CITIES_ID,
      label: t("search.placeholder.city"),
    };
    const list = CITIES.map((c) => ({
      value: c.id,
      label: pickLocalized(c.name),
    })).sort((a, b) =>
      a.label.localeCompare(b.label, lang, { sensitivity: "base" }),
    );
    return [all, ...list];
  }, [t, lang, pickLocalized]);

  const districtOptions = useMemo<Option[]>(() => {
    const all: Option = {
      value: "all",
      label: t("search.placeholder.district"),
    };
    const list = districts
      .map((d) => ({ value: d, label: d }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, lang, { sensitivity: "base" }),
      );
    return [all, ...list];
  }, [t, lang, districts]);

  const districtDisabled = value.cityId === ALL_CITIES_ID;

  // On mobile we hide district + price by default and gate them behind a
  // toggle. Without this the card pushes the catalog way below the fold.
  // Auto-expand if the user already has any of those fields set (e.g. they
  // came back to the page or deep-linked) so they're never hidden.
  const hasAdvanced =
    value.districtId !== "all" ||
    value.priceMin !== "" ||
    value.priceMax !== "";
  const [showAdvanced, setShowAdvanced] = useState<boolean>(hasAdvanced);
  // Keep desktop state ignored — on >=sm the toggle is moot because all
  // four fields fit in the grid anyway.

  return (
    <Card className="p-3 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FilterSelect
          label={t("search.label.specialist")}
          value={value.category}
          options={categoryOptions}
          onChange={(v) =>
            set("category", (v ?? "all") as SearchFiltersValue["category"])
          }
        />
        <FilterSelect
          label={t("search.label.city")}
          value={value.cityId}
          options={cityOptions}
          onChange={(v) => set("cityId", v ?? ALL_CITIES_ID)}
        />
        <div className={cn(!showAdvanced && "hidden sm:block")}>
          <FilterSelect
            label={t("search.label.district")}
            value={value.districtId}
            options={districtOptions}
            disabled={districtDisabled}
            onChange={(v) => set("districtId", v ?? "all")}
          />
        </div>

        <div className={cn(!showAdvanced && "hidden sm:block")}>
          <PriceRange
            label={t("search.label.price")}
            from={value.priceMin}
            to={value.priceMax}
            onChange={(side, v) =>
              side === "from" ? set("priceMin", v) : set("priceMax", v)
            }
            placeholders={{
              from: t("search.placeholder.priceFrom"),
              to: t("search.placeholder.priceTo"),
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
        className="sm:hidden mt-3 inline-flex items-center gap-1 text-sm font-medium text-caspian-600 h-9 px-1"
      >
        <ChevronDown
          className={cn("size-4 transition-transform", showAdvanced && "rotate-180")}
        />
        {showAdvanced
          ? pickLocalized({ az: "Daha az filtr", ru: "Меньше фильтров" })
          : pickLocalized({ az: "Daha çox filtr", ru: "Больше фильтров" })}
      </button>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onShow}
        className="w-full mt-3 sm:mt-4 h-12"
      >
        {t("search.action.show")}
      </Button>
    </Card>
  );
}

// =============================================================================
// FilterSelect — input-style trigger + floating dropdown menu
// =============================================================================

type Option = { value: string; label: string };

function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
  tone = "default",
  disabled = false,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string | null) => void;
  className?: string;
  tone?: "default" | "accent";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-disabled={disabled}
          disabled={disabled}
          className={cn(
            "flex items-center justify-between gap-2 h-11 w-full px-4 rounded-xl text-sm font-medium transition-colors",
            tone === "accent"
              ? "bg-caspian-50 text-caspian-700 hover:bg-caspian-100"
              : "bg-ink-50 text-ink-800 hover:bg-ink-100",
            disabled && "opacity-50 cursor-not-allowed hover:bg-ink-50",
          )}
        >
          <span className="truncate text-left">{current?.label ?? ""}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform",
              tone === "accent" ? "text-caspian-600" : "text-ink-500",
              open && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="listbox"
              key="dropdown"
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-full mt-2 origin-top bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-1.5 z-50 max-h-72 overflow-y-auto"
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 h-10 rounded-lg text-sm text-left transition-colors",
                      active
                        ? "bg-caspian-50 text-caspian-700 font-semibold"
                        : "text-ink-700 hover:bg-ink-50",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active ? (
                      <Check className="size-3.5 text-caspian-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// PriceRange — twin numeric inputs joined inside a single gray pill
// =============================================================================

function PriceRange({
  label,
  from,
  to,
  onChange,
  placeholders,
  className,
}: {
  label: string;
  from: string;
  to: string;
  onChange: (side: "from" | "to", value: string) => void;
  placeholders: { from: string; to: string };
  className?: string;
}) {
  // Only digits — currency suffix sits outside the inputs.
  const sanitize = (v: string) => v.replace(/[^\d]/g, "");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-stretch h-11 w-full rounded-xl bg-ink-50 overflow-hidden">
        <input
          type="text"
          inputMode="numeric"
          value={from}
          onChange={(e) => onChange("from", sanitize(e.target.value))}
          placeholder={placeholders.from}
          aria-label={`${label} ${placeholders.from}`}
          className="flex-1 min-w-0 bg-transparent px-4 text-sm font-mono text-ink-800 placeholder:text-ink-400 outline-none"
        />
        <span aria-hidden className="self-center w-px h-5 bg-ink-300/60" />
        <input
          type="text"
          inputMode="numeric"
          value={to}
          onChange={(e) => onChange("to", sanitize(e.target.value))}
          placeholder={placeholders.to}
          aria-label={`${label} ${placeholders.to}`}
          className="flex-1 min-w-0 bg-transparent px-4 text-sm font-mono text-ink-800 placeholder:text-ink-400 outline-none"
        />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500">
      {children}
    </span>
  );
}

// =============================================================================
// SortDropdown — standalone control rendered above the results list.
// Trigger style mimics Auto.ru: leading up/down-arrows glyph, label, chevron.
// =============================================================================

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const currentLabel =
    t(
      (SORT_OPTIONS.find((o) => o.value === value)?.labelKey ??
        SORT_OPTIONS[0].labelKey) as DictKey,
    );

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium text-ink-800 hover:bg-ink-50 transition-colors"
      >
        <SortGlyph />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sort-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-2 w-60 origin-top-left bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-1.5 z-50"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 h-10 rounded-lg text-sm text-left transition-colors",
                    active
                      ? "bg-caspian-50 text-caspian-700 font-semibold"
                      : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  <span className="truncate">{t(opt.labelKey)}</span>
                  {active ? (
                    <Check className="size-3.5 text-caspian-600 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline up/down arrows glyph — lucide-react in this project doesn't ship
// `ArrowUpDown` reliably, so we render a tiny SVG instead.
function SortGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-ink-500"
      aria-hidden
      {...props}
    >
      <path d="M4 3v10" />
      <path d="m2 5 2-2 2 2" />
      <path d="M12 13V3" />
      <path d="m10 11 2 2 2-2" />
    </svg>
  );
}
