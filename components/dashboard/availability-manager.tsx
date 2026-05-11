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
  const { t, pickLocalized } = useT();

  const initialCity = me.city ? pickLocalized(me.city) : "";
  const initialAddress = me.district ? pickLocalized(me.district) : "";

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
  const [activeDays, setActiveDays] = useState<boolean[]>(() =>
    Array.from({ length: 7 }, () => true),
  );
  const [city, setCity] = useState<string>(initialCity);
  const [address, setAddress] = useState<string>(initialAddress);

  // Sync local state with `me` when not editing — e.g. after another screen
  // updates the same provider.
  useEffect(() => {
    if (isEditing) return;
    setStart(me.workingHours.start);
    setEnd(me.workingHours.end);
    setBreaks(me.breaks);
    setCity(me.city ? pickLocalized(me.city) : "");
    setAddress(me.district ? pickLocalized(me.district) : "");
  }, [me, isEditing, pickLocalized]);

  useEffect(() => {
    if (savedAt === null) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const isDirty = useMemo(() => {
    if (start !== me.workingHours.start) return true;
    if (end !== me.workingHours.end) return true;
    if (!breaksEqual(breaks, me.breaks)) return true;
    if (city.trim() !== initialCity) return true;
    if (address.trim() !== initialAddress) return true;
    return false;
  }, [
    start,
    end,
    breaks,
    city,
    address,
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
    setNewBreakStart("");
    setNewBreakEnd("");
    setErrorMsg(null);
    setIsEditing(false);
  };

  const addBreak = () => {
    if (!isEditing) return;
    if (!newBreakStart || !newBreakEnd) return;
    if (newBreakEnd <= newBreakStart) return;
    setBreaks((prev) => [...prev, { start: newBreakStart, end: newBreakEnd }]);
    setNewBreakStart("");
    setNewBreakEnd("");
  };

  const removeBreak = (idx: number) => {
    if (!isEditing) return;
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
    const payload = {
      workingHours: { start, end },
      breaks,
      city: trimmedCity ? { az: trimmedCity, ru: trimmedCity } : undefined,
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
    <Card className="p-6">
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
          >
            {t("dash.avail.cancelEdit")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={enterEdit}
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
                  "h-10 px-4 rounded-[10px] text-sm font-medium border transition-colors",
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
                className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-saffron-50 text-saffron-500 text-sm font-medium font-mono"
              >
                {b.start} – {b.end}
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => removeBreak(i)}
                    aria-label={`${b.start} – ${b.end} ${t("dash.avail.breaks.removeAria")}`}
                    className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {isEditing ? (
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
        ) : null}
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

      {/* Bottom row — Save (visible only while editing) */}
      {isEditing ? (
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
          <Button
            type="button"
            variant="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={!isDirty || saving}
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
