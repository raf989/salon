"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { createTender, updateTender } from "@/lib/api/repo";
import { getTodayISO } from "@/lib/utils";
import {
  KIND_LABELS,
  PROVIDER_TIER_OF,
  type Localized,
  type ProviderKind,
  type ProviderTier,
  type Tender,
} from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  /** Edit mode — when set the form preloads from this tender and the
   *  submit goes through `updateTender(existing.id, …)` instead of create. */
  existing?: Tender;
};

const KIND_OPTIONS: ProviderKind[] = [
  "photographer",
  "dj",
  "restaurant",
  "host",
  "barber",
  "salon",
  "makeup",
];

export function CreateTenderModal({
  open,
  onClose,
  onCreated,
  existing,
}: Props) {
  const { t } = useT();
  const title = existing
    ? t("tenders.edit.title")
    : t("tenders.create.title");
  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-2xl">
      {/* Keyed inner form remounts on each open AND when switching between
          edit targets so prior input doesn't linger. */}
      <CreateTenderForm
        key={`${open ? "open" : "closed"}-${existing?.id ?? "new"}`}
        onClose={onClose}
        onCreated={onCreated}
        existing={existing}
      />
    </Dialog>
  );
}

function CreateTenderForm({
  onClose,
  onCreated,
  existing,
}: {
  onClose: () => void;
  onCreated?: (id: string) => void;
  existing?: Tender;
}) {
  const { t, lang, pickLocalized } = useT();
  const currentUser = useCurrentUser();
  const isEdit = !!existing;

  // Preload from `existing` in edit mode; empty defaults otherwise. The
  // description / title come out of `Localized` — pick the AZ side since
  // we mirror both halves on save anyway.
  const [tier, setTier] = useState<ProviderTier>(existing?.tier ?? "event");
  const [kind, setKind] = useState<ProviderKind>(
    existing?.kind ?? "photographer",
  );
  const [title, setTitle] = useState<string>(existing?.title?.az ?? "");
  const [description, setDescription] = useState<string>(
    existing?.description?.az ?? "",
  );
  const [budgetMin, setBudgetMin] = useState<string>(
    existing ? String(existing.budgetMin) : "",
  );
  const [budgetMax, setBudgetMax] = useState<string>(
    existing ? String(existing.budgetMax) : "",
  );
  const [eventDate, setEventDate] = useState<string>(
    existing?.eventDate ?? "",
  );
  const [eventTime, setEventTime] = useState<string>(
    existing?.eventTime ?? "",
  );
  const [district, setDistrict] = useState<string>(
    existing?.district?.az ?? "",
  );
  const [tagsRaw, setTagsRaw] = useState<string>(
    existing ? existing.tags.map((tag) => tag.az).join(", ") : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tier is derived from kind via PROVIDER_TIER_OF — kept in state only because
  // `createTender` accepts both fields.
  const handleKindChange = (next: ProviderKind) => {
    setKind(next);
    setTier(PROVIDER_TIER_OF[next]);
  };

  const budgetMinNum = Number(budgetMin);
  const budgetMaxNum = Number(budgetMax);
  const todayMin = getTodayISO();
  // iOS Safari ignores `min={...}` on <input type="date"> so we re-check
  // the boundary in JS too. Compared as ISO strings (YYYY-MM-DD) → simple
  // lexical compare works.
  const eventDateValid = eventDate.length === 10 && eventDate >= todayMin;
  const ready =
    !!currentUser &&
    title.trim().length >= 4 &&
    description.trim().length >= 20 &&
    Number.isFinite(budgetMinNum) &&
    budgetMinNum > 0 &&
    Number.isFinite(budgetMaxNum) &&
    budgetMaxNum >= budgetMinNum &&
    eventDateValid &&
    district.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting || !currentUser) return;
    setSubmitting(true);
    setError(null);
    try {
      const tags: Localized[] = tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => ({ az: s, ru: s }));

      const payload = {
        tier,
        kind,
        title: { az: title.trim(), ru: title.trim() },
        description: { az: description.trim(), ru: description.trim() },
        budgetMin: budgetMinNum,
        budgetMax: budgetMaxNum,
        // Deadline isn't a separate concept here — bids close at the
        // event date.
        deadline: eventDate,
        eventDate,
        eventTime: eventTime || undefined,
        tags,
        authorName: currentUser.name,
        authUserId: existing?.authUserId ?? currentUser.id,
        district: { az: district.trim(), ru: district.trim() },
      };
      const saved = existing
        ? await updateTender(existing.id, payload)
        : await createTender(payload);
      onCreated?.(saved.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-h-[78vh] sm:max-h-[78vh] overflow-y-auto -mr-1 pr-1"
    >
        {!currentUser ? (
          <p className="text-sm text-pomegranate-500 leading-relaxed border border-pomegranate-200 bg-pomegranate-50 rounded-[10px] px-3 py-2">
            {t("tenders.create.notLoggedIn")}
          </p>
        ) : null}

        <div>
          <SectionLabel>{t("tenders.create.field.kind")}</SectionLabel>
          <select
            value={kind}
            onChange={(e) => handleKindChange(e.target.value as ProviderKind)}
            className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-sm text-ink-800 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)]"
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {pickLocalized(KIND_LABELS[k])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <SectionLabel>{t("tenders.create.field.title")}</SectionLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <SectionLabel>{t("tenders.create.field.description")}</SectionLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={submitting}
            className="w-full rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)] disabled:opacity-50 disabled:pointer-events-none resize-none"
          />
        </div>

        <div>
          <SectionLabel>{t("tenders.create.field.budget")}</SectionLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="min"
              disabled={submitting}
            />
            <span className="text-ink-400">–</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="max"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>{t("tenders.create.field.eventDate")}</SectionLabel>
            <Input
              type="date"
              min={todayMin}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <SectionLabel>{t("tenders.create.field.eventTime")}</SectionLabel>
            <Input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <SectionLabel>{t("tenders.create.field.district")}</SectionLabel>
          <Input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <SectionLabel>{t("tenders.create.field.tags")}</SectionLabel>
          <Input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder={
              lang === "ru"
                ? "свадьба, банкет, корпоратив"
                : "toy, banket, korporativ"
            }
            disabled={submitting}
          />
        </div>

        {error ? (
          <p className="text-sm text-pomegranate-500 leading-relaxed">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-1">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={submitting}
          >
            {t("booking.success.close")}
          </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!ready || submitting}
        >
          {submitting
            ? t("tenders.bid.submitting")
            : isEdit
              ? t("tenders.edit.submit")
              : t("tenders.create.submit")}
        </Button>
      </div>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
      {children}
    </div>
  );
}
