"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Search, Check, ChevronDown } from "lucide-react";
import { CITIES, getCityById } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CitySelector({
  className,
  variant = "pill",
}: {
  className?: string;
  variant?: "pill" | "inline";
}) {
  const cityId = useStore((s) => s.cityId);
  const setCityId = useStore((s) => s.setCityId);
  const { lang, pickLocalized } = useT();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = getCityById(cityId);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((c) =>
      pickLocalized(c.name).toLowerCase().includes(q),
    );
  }, [query, pickLocalized]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          variant === "pill"
            ? "flex items-center gap-1.5 text-sm font-medium text-ink-700 px-2.5 py-1.5 rounded-lg border border-border hover:bg-ink-50 transition-colors"
            : "inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors",
        )}
      >
        <MapPin className="size-4 text-ink-400" />
        <span>{pickLocalized(current.name)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-2 z-50"
        >
          <div className="flex items-center gap-2 px-2.5 h-9 rounded-lg bg-ink-50 mb-2">
            <Search className="size-4 text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "ru" ? "Поиск города…" : "Şəhəri axtar…"
              }
              className="flex-1 bg-transparent border-0 outline-none text-sm text-ink-800 placeholder:text-ink-400 min-w-0"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-sm text-ink-400 text-center py-6">
                {lang === "ru" ? "Ничего не найдено" : "Heç nə tapılmadı"}
              </div>
            ) : (
              filtered.map((c) => {
                const active = c.id === cityId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setCityId(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 h-9 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-caspian-50 text-caspian-700 font-semibold"
                        : "text-ink-700 hover:bg-ink-50",
                    )}
                  >
                    <span>{pickLocalized(c.name)}</span>
                    {active && (
                      <Check className="size-4 text-caspian-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
