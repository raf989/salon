"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Coffee, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stylist } from "@/lib/types";

export type AvailabilityManagerProps = {
  me: Stylist;
};

type Break = { start: string; end: string };

const WEEKDAYS = ["B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş.", "B."] as const;

export function AvailabilityManager({ me }: AvailabilityManagerProps) {
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
    const t = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(t);
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
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
          <Clock className="size-4" />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-neutral-100">
          Əlçatanlığım
        </h2>
      </div>

      <div className="mt-5 space-y-6">
        {/* Working hours */}
        <section>
          <h3 className="text-sm font-medium text-neutral-200">İş saatları</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TimeField
              label="Başlama"
              value={start}
              onChange={setStart}
            />
            <TimeField label="Bitirmə" value={end} onChange={setEnd} />
          </div>
        </section>

        {/* Breaks */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Coffee className="size-4 text-[var(--accent)]" /> Fasilələr
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {breaks.length === 0 ? (
              <p className="text-xs text-neutral-500">Fasilə yoxdur.</p>
            ) : (
              breaks.map((b, i) => (
                <BreakChip
                  key={`${b.start}-${b.end}-${i}`}
                  label={`${b.start} – ${b.end}`}
                  onRemove={() => removeBreak(i)}
                />
              ))
            )}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TimeField
              label="Başlama"
              value={newBreakStart}
              onChange={setNewBreakStart}
              compact
            />
            <TimeField
              label="Bitirmə"
              value={newBreakEnd}
              onChange={setNewBreakEnd}
              compact
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={addBreak}
              disabled={
                !newBreakStart ||
                !newBreakEnd ||
                newBreakEnd <= newBreakStart
              }
            >
              <Plus className="size-4" />
              Əlavə et
            </Button>
          </div>
        </section>

        {/* Active days */}
        <section>
          <h3 className="text-sm font-medium text-neutral-200">Aktiv günlər</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKDAYS.map((label, i) => {
              const active = activeDays[i];
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium tracking-tight transition-all duration-200",
                    active
                      ? "border-[var(--accent)]/35 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_0_12px_-4px_rgba(212,165,116,0.5)]"
                      : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 hover:text-neutral-200",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <AnimatePresence mode="wait">
            {savedAt !== null ? (
              <motion.div
                key={savedAt}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300"
              >
                <Check className="size-3.5" /> Yeniləndi!
              </motion.div>
            ) : (
              <span />
            )}
          </AnimatePresence>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onSave}
          >
            Yadda saxla
          </Button>
        </div>
      </div>
    </Card>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
};

function TimeField({ label, value, onChange, compact }: TimeFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-neutral-100 backdrop-blur-xl transition-all duration-200",
          "focus-visible:border-[var(--accent)]/40 focus-visible:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20",
          "[color-scheme:dark]",
          compact ? "h-10" : "h-11",
        )}
      />
    </label>
  );
}

function BreakChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-3 pr-1.5 text-xs text-neutral-200"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} fasiləsini sil`}
        className="flex size-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-100"
      >
        <X className="size-3" />
      </button>
    </motion.span>
  );
}
