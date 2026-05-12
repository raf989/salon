"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateProvider } from "@/lib/api/repo";
import { normalizeCity } from "@/lib/cities";
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
  "h-11 w-full bg-surface border border-border-strong rounded-[10px] px-3 font-mono text-sm text-ink-800 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)] disabled:bg-ink-50/60 disabled:text-ink-500 disabled:cursor-not-allowed disabled:hover:border-border-strong";

function breaksEqual(a: Break[], b: Break[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].start !== b[i].start || a[i].end !== b[i].end) return false;
  }
  return true;
}

export function AvailabilityManager({ me }: AvailabilityManagerProps) {
  const { t, lang } = useT();

  // Read localized strings via `lang` (stable string) rather than the
  // `pickLocalized` function — that function is a fresh reference every
  // render, which would re-fire the sync-effect into an infinite loop.
  const initialCity = me.city ? me.city[lang] : "";
  const initialAddress = me.district ? me.district[lang] : "";

  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [start, setStart] = useState<string>(me.workingHours.start);
  const [end, setEnd] = useState<string>(me.workingHours.end);
  const [breaks, setBreaks] = useState<Break[]>(me.breaks);
  const [newBreakStart, setNewBreakStart] = useState<string>("");
  const [newBreakEnd, setNewBreakEnd] = useState<string>("");
  // `me.activeDays` is an array of weekday-dict indices (0=Sun..6=Sat) the
  // provider is active on. Absent / undefined means "all days active" so the
  // toggle row defaults to fully on.
  const [activeDays, setActiveDays] = useState<boolean[]>(() => {
    if (me.activeDays === undefined) {
      return Array.from({ length: 7 }, () => true);
    }
    const set = new Set(me.activeDays);
    return WEEKDAY_DICT_INDICES.map((dictIdx) => set.has(dictIdx));
  });
  const [city, setCity] = useState<string>(initialCity);
  const [address, setAddress] = useState<string>(initialAddress);

  // Sync local state with `me` when not editing — e.g. after another screen
  // updates the same provider. Deps are primitive/stable (no function refs)
  // so the effect doesn't re-fire on every render.
  useEffect(() => {
    if (isEditing) return;
    setStart(me.workingHours.start);
    setEnd(me.workingHours.end);
    setBreaks(me.breaks);
    setCity(me.city ? me.city[lang] : "");
    setAddress(me.district ? me.district[lang] : "");
    if (me.activeDays === undefined) {
      setActiveDays(Array.from({ length: 7 }, () => true));
    } else {
      const set = new Set(me.activeDays);
      setActiveDays(WEEKDAY_DICT_INDICES.map((dictIdx) => set.has(dictIdx)));
    }
  }, [me, isEditing, lang]);

  useEffect(() => {
    if (savedAt === null) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  // Snapshot of the saved active-days as a boolean[7] in visible-row order so
  // the dirty check can do a positional compare.
  const savedActiveDays = useMemo<boolean[]>(() => {
    if (me.activeDays === undefined) {
      return Array.from({ length: 7 }, () => true);
    }
    const set = new Set(me.activeDays);
    return WEEKDAY_DICT_INDICES.map((dictIdx) => set.has(dictIdx));
  }, [me.activeDays]);

  const isDirty = useMemo(() => {
    if (start !== me.workingHours.start) return true;
    if (end !== me.workingHours.end) return true;
    if (!breaksEqual(breaks, me.breaks)) return true;
    if (city.trim() !== initialCity) return true;
    if (address.trim() !== initialAddress) return true;
    for (let i = 0; i < 7; i++) {
      if (activeDays[i] !== savedActiveDays[i]) return true;
    }
    return false;
  }, [
    start,
    end,
    breaks,
    city,
    address,
    activeDays,
    savedActiveDays,
    me.workingHours.start,
    me.workingHours.end,
    me.breaks,
    initialCity,
    initialAddress,
  ]);

  const enterEdit = () => setIsEditing(true);

  const cancelEdit = () => {
    setStart(me.workingHours.start);
    setEnd(me.workingHours.end);
    setBreaks(me.breaks);
    setCity(initialCity);
    setAddress(initialAddress);
    setActiveDays(savedActiveDays);
    setNewBreakStart("");
    setNewBreakEnd("");
    setErrorMsg(null);
    setIsEditing(false);
  };

  const addBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    if (newBreakEnd <= newBreakStart) return;
    // Auto-enter edit mode so the Save button surfaces and the sync-effect
    // doesn't immediately overwrite the new break with the persisted state.
    if (!isEditing) setIsEditing(true);
    setBreaks((prev) => [...prev, { start: newBreakStart, end: newBreakEnd }]);
    setNewBreakStart("");
    setNewBreakEnd("");
  };

  const removeBreak = (idx: number) => {
    if (!isEditing) setIsEditing(true);
    setBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleDay = (idx: number) => {
    if (!isEditing) return;
    setActiveDays((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const persist = async () => {
    setSaving(true);
    setErrorMsg(null);
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    // Convert the visible-row boolean[7] back to an array of dict indices
    // (0=Sun..6=Sat). Always pass the explicit array — null/undefined would
    // mean "all days active" and we want to faithfully persist whatever the
    // user toggled.
    const activeDaysPayload = WEEKDAY_DICT_INDICES.filter(
      (_, i) => activeDays[i],
    );
    const payload = {
      workingHours: { start, end },
      breaks,
      activeDays: activeDaysPayload,
      city: trimmedCity
        ? normalizeCity({ az: trimmedCity, ru: trimmedCity })
        : undefined,
      district: trimmedAddress
        ? { az: trimmedAddress, ru: trimmedAddress }
        : undefined,
    };
    try {
      await updateProvider(me.id, payload);
      setIsEditing(false);
      setConfirmOpen(false);
      setSavedAt(Date.now());
    } catch (err) {
      // Surface the real cause — Supabase plain objects collapse to
      // "[object Object]" when thrown into React's error overlay.
      // eslint-disable-next-line no-console
      console.error("[AvailabilityManager.persist] failed", err, payload);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err);
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const disabled = !isEditing;

  return (
    <Card className="p-4 sm:p-6">
      {/* Top bar with Edit / Cancel toggle */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink-900">
            {t("dash.avail.title")}
          </h2>
        </div>
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelEdit}
            disabled={saving}
            className="min-h-11"
          >
            {t("dash.avail.cancelEdit")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={enterEdit}
            className="min-h-11"
          >
            <Pencil className="size-3.5" />
            {t("dash.avail.edit")}
          </Button>
        )}
      </div>

      {/* Section 1 — Working hours */}
      <section className="mt-5">
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
              disabled={disabled}
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
              disabled={disabled}
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
                disabled={disabled}
                className={cn(
                  // h-11 (44px) meets the iOS/Android tap-target guideline.
                  "h-11 min-w-11 px-4 rounded-[10px] text-sm font-medium border transition-colors",
                  active
                    ? "bg-caspian-500 text-white border-caspian-500"
                    : "bg-ink-50 text-ink-700 border-transparent hover:bg-ink-100",
                  disabled && "opacity-60 cursor-not-allowed hover:bg-ink-50",
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
                className="inline-flex items-center gap-1 h-11 sm:h-9 pl-3 pr-1 sm:pr-3 rounded-full bg-saffron-50 text-saffron-500 text-sm font-medium font-mono"
              >
                {b.start} – {b.end}
                <button
                  type="button"
                  onClick={() => removeBreak(i)}
                  aria-label={`${b.start} – ${b.end} ${t("dash.avail.breaks.removeAria")}`}
                  className="ml-1 size-8 sm:size-5 grid place-items-center rounded-full opacity-70 hover:opacity-100 hover:bg-saffron-100 transition-all"
                >
                  <X className="size-3.5 sm:size-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* On narrow screens the add button drops to its own row so the
            two time inputs keep their full width (otherwise the button
            squeezes the end time to ~60px). */}
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] items-end gap-2 mt-3">
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
            className="col-span-2 sm:col-span-1 min-h-11"
          >
            {t("dash.avail.breaks.add")}
          </Button>
        </div>
      </section>

      {/* Section 4 — Location & address */}
      <section className="border-t border-border pt-5 mt-5">
        <h3 className="font-display font-semibold text-lg text-ink-900">
          {t("dash.avail.location.title")}
        </h3>
        <p className="text-sm text-ink-500 mt-0.5">
          {t("dash.avail.location.sub")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("dash.avail.location.city.placeholder")}
            disabled={disabled}
            aria-label={t("dash.avail.location.city.placeholder")}
          />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("dash.avail.location.address.placeholder")}
            disabled={disabled}
            aria-label={t("dash.avail.location.address.placeholder")}
          />
        </div>
      </section>

      {/* Bottom row — Save (visible only while editing).
          On mobile the form is very tall — the Save action gets sticky-bottom
          treatment so users don't have to scroll back to the top of the card
          to commit. The negative margins cancel the Card's padding so the
          sticky strip can hug the card edges, and safe-area padding stays
          clear of the iOS home indicator. */}
      {isEditing ? (
        <div
          className={cn(
            "border-t border-border mt-5 flex items-center justify-end gap-3",
            "pt-4 pb-4 px-4 -mx-4 -mb-4 sm:pt-5 sm:pb-0 sm:px-0 sm:mx-0 sm:mb-0",
            "sticky bottom-0 z-20 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:static sm:bg-transparent sm:backdrop-blur-none",
            "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0",
          )}
        >
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
          <Button
            type="button"
            variant="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={!isDirty || saving}
            className="min-h-11 flex-1 sm:flex-none"
          >
            {t("dash.avail.save")}
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {savedAt !== null ? (
            <motion.div
              key={savedAt}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border pt-5 mt-5 flex justify-end"
            >
              <Badge variant="success-soft" pulse>
                {t("dash.avail.saved")}
              </Badge>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (saving) return;
          setConfirmOpen(false);
          setErrorMsg(null);
        }}
        title={t("dash.avail.confirm.title")}
      >
        <p className="text-sm text-ink-600">
          {t("dash.avail.confirm.body")}
        </p>
        {errorMsg ? (
          <div className="mt-4 rounded-[10px] border border-pomegranate-500/30 bg-pomegranate-500/5 px-3 py-2 text-sm text-pomegranate-500">
            {errorMsg}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setConfirmOpen(false);
              setErrorMsg(null);
            }}
            disabled={saving}
          >
            {t("dash.avail.confirm.no")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              void persist();
            }}
            disabled={saving}
          >
            {saving ? t("booking.confirming") : t("dash.avail.confirm.yes")}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
