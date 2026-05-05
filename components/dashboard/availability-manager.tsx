"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Stylist } from "@/lib/types";

export type AvailabilityManagerProps = {
  me: Stylist;
};

type Break = { start: string; end: string };

// Visible order is Mon→Sun; dict index 0 = Sunday, so map: Mon=1..Sat=6, Sun=0
const WEEKDAY_DICT_INDICES: ReadonlyArray<0 | 1 | 2 | 3 | 4 | 5 | 6> = [
  1, 2, 3, 4, 5, 6, 0,
];

const TIME_INPUT_CLASS =
  "h-11 w-full bg-surface border border-border-strong rounded-[10px] px-3 font-mono text-sm text-ink-800 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)]";

export function AvailabilityManager({ me }: AvailabilityManagerProps) {
  const { t } = useT();
  const [start, setStart] = useState<string>(me.workingHours.start);
  const [end, setEnd] = useState<string>(me.workingHours.end);
  const [breaks, setBreaks] = useState<Break[]>(me.breaks);
  const [newBreakStart, setNewBreakStart] = useState<string>("");
  const [newBreakEnd, setNewBreakEnd] = useState<string>("");
  const [activeDays, setActiveDays] = useState<boolean[]>(() =>
    Array.from({ length: 7 }, () => true),
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (savedAt === null) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const addBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    if (newBreakEnd <= newBreakStart) return;
    setBreaks((prev) => [...prev, { start: newBreakStart, end: newBreakEnd }]);
    setNewBreakStart("");
    setNewBreakEnd("");
  };

  const removeBreak = (idx: number) => {
    setBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleDay = (idx: number) => {
    setActiveDays((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const onSave = () => {
    setSavedAt(Date.now());
  };

  return (
    <Card className="p-6">
      {/* Section 1 — Working hours */}
      <section>
        <h3 className="font-display font-semibold text-lg text-ink-900">
          {t("dash.avail.hours.title")}
        </h3>
        <p className="text-sm text-ink-500 mt-0.5">
          {t("dash.avail.hours.sub")}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
              {t("dash.avail.hours.start")}
            </span>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={TIME_INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
              {t("dash.avail.hours.end")}
            </span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={TIME_INPUT_CLASS}
            />
          </label>
        </div>
      </section>

      {/* Section 2 — Active days */}
      <section className="border-t border-border pt-5 mt-5">
        <h3 className="font-display font-semibold text-lg text-ink-900">
          {t("dash.avail.days.title")}
        </h3>
        <p className="text-sm text-ink-500 mt-0.5">
          {t("dash.avail.days.sub")}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {WEEKDAY_DICT_INDICES.map((dictIdx, i) => {
            const active = activeDays[i];
            const label = t(`weekday.short.${dictIdx}` as DictKey);
            return (
              <button
                key={dictIdx}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={active}
                className={cn(
                  "h-10 px-4 rounded-[10px] text-sm font-medium border transition-colors",
                  active
                    ? "bg-caspian-500 text-white border-caspian-500"
                    : "bg-ink-50 text-ink-700 border-transparent hover:bg-ink-100",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3 — Breaks */}
      <section className="border-t border-border pt-5 mt-5">
        <h3 className="font-display font-semibold text-lg text-ink-900">
          {t("dash.avail.breaks.title")}
        </h3>
        <p className="text-sm text-ink-500 mt-0.5">
          {t("dash.avail.breaks.sub")}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <AnimatePresence initial={false}>
            {breaks.map((b, i) => (
              <motion.span
                key={`${b.start}-${b.end}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-saffron-50 text-saffron-500 text-sm font-medium font-mono"
              >
                {b.start} – {b.end}
                <button
                  type="button"
                  onClick={() => removeBreak(i)}
                  aria-label={`${b.start} – ${b.end} ${t("dash.avail.breaks.removeAria")}`}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 mt-3">
          <input
            type="time"
            value={newBreakStart}
            onChange={(e) => setNewBreakStart(e.target.value)}
            className={TIME_INPUT_CLASS}
          />
          <input
            type="time"
            value={newBreakEnd}
            onChange={(e) => setNewBreakEnd(e.target.value)}
            className={TIME_INPUT_CLASS}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBreak}
            disabled={
              !newBreakStart ||
              !newBreakEnd ||
              newBreakEnd <= newBreakStart
            }
          >
            {t("dash.avail.breaks.add")}
          </Button>
        </div>
      </section>

      {/* Bottom row — Save */}
      <div className="border-t border-border pt-5 mt-5 flex items-center justify-end gap-3">
        <AnimatePresence mode="wait">
          {savedAt !== null ? (
            <motion.div
              key={savedAt}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="success-soft" pulse>
                {t("dash.avail.saved")}
              </Badge>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Button type="button" variant="primary" onClick={onSave}>
          {t("dash.avail.save")}
        </Button>
      </div>
    </Card>
  );
}
