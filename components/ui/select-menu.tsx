"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  /** Currently selected value. `null` keeps the placeholder showing. */
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  /** If set, an "all / clear" row is rendered at the top of the list. */
  allOptionLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerPlaceholder: string;
  triggerVariant?: "inline" | "pill";
  /** Inner search-in-list input. Default `true`. */
  withSearch?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Side the panel anchors to. Default `right`. */
  align?: "left" | "right";
  className?: string;
};

// Show exactly 5 items at a time, then scroll. h-11 = 44px.
const ITEM_HEIGHT_PX = 44;
const VISIBLE_ITEMS = 5;
const MAX_LIST_HEIGHT_PX = ITEM_HEIGHT_PX * VISIBLE_ITEMS;

export function SelectMenu({
  value,
  onChange,
  options,
  allOptionLabel,
  triggerIcon,
  triggerPlaceholder,
  triggerVariant = "inline",
  withSearch = true,
  searchPlaceholder = "",
  emptyLabel = "—",
  align = "right",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const triggerLabel = selected ? selected.label : triggerPlaceholder;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          triggerVariant === "pill"
            ? "flex items-center gap-1.5 text-sm font-medium text-ink-700 px-2.5 py-1.5 rounded-lg border border-border hover:bg-ink-50 transition-colors"
            : "inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors whitespace-nowrap",
        )}
      >
        {triggerIcon}
        <span>{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-2 z-50",
              align === "left"
                ? "left-0 origin-top-left"
                : "right-0 origin-top-right",
            )}
          >
            {withSearch ? (
              <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-ink-50 mb-2">
                <Search className="size-4 text-ink-400 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-ink-800 placeholder:text-ink-400 min-w-0"
                />
              </div>
            ) : null}

            <div
              className="overflow-y-auto"
              style={{ maxHeight: `${MAX_LIST_HEIGHT_PX}px` }}
            >
              {allOptionLabel ? (
                <Row
                  label={allOptionLabel}
                  active={value === null}
                  onClick={() => {
                    onChange(null);
                    close();
                  }}
                />
              ) : null}

              {filtered.length === 0 ? (
                <div className="text-sm text-ink-400 text-center py-6">
                  {emptyLabel}
                </div>
              ) : (
                filtered.map((opt) => (
                  <Row
                    key={opt.value}
                    label={opt.label}
                    active={opt.value === value}
                    onClick={() => {
                      onChange(opt.value);
                      close();
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 h-11 rounded-lg text-sm text-left transition-colors",
        active
          ? "bg-caspian-50 text-caspian-700 font-semibold"
          : "text-ink-700 hover:bg-ink-50",
      )}
    >
      <span>{label}</span>
      {active && <Check className="size-4 text-caspian-600 shrink-0" />}
    </button>
  );
}
