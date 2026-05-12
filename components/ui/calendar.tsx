"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, getTodayISO } from "@/lib/utils";
import { useT, type DictKey } from "@/lib/i18n";

export type DayState = "default" | "busy" | "free";

type Props = {
  /** "YYYY-MM-DD" anchor day in the month to render. Defaults to today. */
  monthAnchor?: string;
  /** "YYYY-MM-DD" currently selected day. */
  selected?: string | null;
  /** "YYYY-MM-DD" today (defaults to actual today). */
  today?: string;
  getDayState?: (iso: string) => DayState;
  onSelect?: (iso: string) => void;
  bare?: boolean;
  className?: string;
  /** default true; ignored when bare */
  showLegend?: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`;
}

function parseISO(iso: string): { year: number; month1: number; day: number } {
  const [y, m, d] = iso.split("-");
  return { year: Number(y), month1: Number(m), day: Number(d) };
}

/** First-of-month anchor as a normalized ISO string (day=01). */
function monthStartISO(iso: string): string {
  const { year, month1 } = parseISO(iso);
  return toISO(year, month1, 1);
}

function shiftMonth(iso: string, delta: number): string {
  const { year, month1 } = parseISO(iso);
  const d = new Date(year, month1 - 1 + delta, 1);
  return toISO(d.getFullYear(), d.getMonth() + 1, 1);
}

function compareYM(a: string, b: string): number {
  const av = parseISO(a);
  const bv = parseISO(b);
  if (av.year !== bv.year) return av.year - bv.year;
  return av.month1 - bv.month1;
}

/** Offset from Sunday-start to Monday-start. JS getDay(): Sun=0..Sat=6 → Mon=0..Sun=6 */
function mondayOffset(jsDay: number): number {
  return (jsDay + 6) % 7;
}

type Cell = {
  iso: string;
  day: number;
  outside: boolean;
};

function buildGrid(anchorISO: string): Cell[] {
  const { year, month1 } = parseISO(anchorISO);
  const firstOfMonth = new Date(year, month1 - 1, 1);
  const offset = mondayOffset(firstOfMonth.getDay());
  // Start from (offset) days before the first of the month
  const start = new Date(year, month1 - 1, 1 - offset);
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      iso: toISO(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      outside: d.getMonth() !== month1 - 1 || d.getFullYear() !== year,
    });
  }
  return cells;
}

export function Calendar({
  monthAnchor,
  selected = null,
  today,
  getDayState,
  onSelect,
  bare = false,
  className,
  showLegend = true,
}: Props) {
  const { t } = useT();
  const todayISO = today ?? getTodayISO();
  const initialAnchor = monthStartISO(monthAnchor ?? todayISO);

  const [viewMonthAnchor, setViewMonthAnchor] = useState<string>(initialAnchor);

  const todayMonthAnchor = monthStartISO(todayISO);
  const minAnchor = shiftMonth(todayMonthAnchor, -6);
  const maxAnchor = shiftMonth(todayMonthAnchor, 6);

  const canPrev = compareYM(viewMonthAnchor, minAnchor) > 0;
  const canNext = compareYM(viewMonthAnchor, maxAnchor) < 0;

  const cells = useMemo<Cell[]>(
    () => buildGrid(viewMonthAnchor),
    [viewMonthAnchor],
  );

  const { year, month1 } = parseISO(viewMonthAnchor);
  const monthLabel = `${t(`month.long.${month1 - 1}` as DictKey)} ${year}`;

  // Monday-first weekday header.
  // Sunday-indexed dict (0=Sun..6=Sat) reordered to Mon..Sun = [1,2,3,4,5,6,0]
  const weekdayHeader: number[] = [1, 2, 3, 4, 5, 6, 0];

  const handlePrev = () => {
    if (!canPrev) return;
    setViewMonthAnchor((cur) => shiftMonth(cur, -1));
  };
  const handleNext = () => {
    if (!canNext) return;
    setViewMonthAnchor((cur) => shiftMonth(cur, 1));
  };

  const cellBase =
    "h-9 w-9 grid place-items-center rounded-lg text-sm font-medium transition-colors";

  const showLegendRow = !bare && showLegend;

  return (
    <div
      className={cn(
        "w-full",
        !bare && "bg-surface border border-border rounded-xl p-4",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          aria-label="Previous month"
          className="h-8 w-8 grid place-items-center rounded-lg text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="font-display font-semibold text-ink-900 text-sm">
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          aria-label="Next month"
          className="h-8 w-8 grid place-items-center rounded-lg text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayHeader.map((wd) => (
          <div
            key={wd}
            className="h-7 grid place-items-center text-[11px] font-medium uppercase tracking-wider text-ink-400"
          >
            {t(`weekday.veryshort.${wd}` as DictKey)}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const state: DayState = cell.outside
            ? "default"
            : (getDayState?.(cell.iso) ?? "default");
          const isToday = cell.iso === todayISO;
          const isSelected = selected !== null && cell.iso === selected;
          const isBusy = !cell.outside && state === "busy";
          const isFree = !cell.outside && state === "free";
          const disabled = cell.outside || isBusy;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(cell.iso)}
              aria-pressed={isSelected}
              aria-label={cell.iso}
              className={cn(
                cellBase,
                cell.outside && "text-ink-300 cursor-default",
                !cell.outside && !isBusy && !isFree && !isSelected &&
                  "text-ink-700 hover:bg-ink-50",
                isFree &&
                  !isSelected &&
                  "bg-success-50 text-success-500 font-semibold hover:bg-success-50",
                isBusy &&
                  "bg-[repeating-linear-gradient(45deg,var(--ink-50)_0_4px,var(--ink-100)_4px_8px)] text-ink-400 cursor-not-allowed line-through",
                isToday &&
                  !isSelected &&
                  "outline outline-[1.5px] outline-caspian-500 outline-offset-[-1px]",
                isSelected &&
                  "bg-caspian-500 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-caspian-500",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {showLegendRow ? (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-success-50 border border-success-500/30" />
            {t("calendar.legend.free")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-pomegranate-500" />
            {t("calendar.legend.busy")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm outline outline-[1.5px] outline-caspian-500 outline-offset-[-1px]" />
            {t("calendar.legend.today")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
