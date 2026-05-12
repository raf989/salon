"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { createTender } from "@/lib/api/repo";
import { cn, getTodayISO } from "@/lib/utils";
import {
  KIND_LABELS,
  PROVIDER_TIER_OF,
  type Localized,
  type ProviderKind,
  type ProviderTier,
} from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
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

export function CreateTenderModal({ open, onClose, onCreated }: Props) {
  const { t } = useT();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("tenders.create.title")}
      className="max-w-2xl"
    >
      {/* Keyed inner form remounts on each open so prior input doesn't linger. */}
      <CreateTenderForm
        key={open ? "open" : "closed"}
        onClose={onClose}
        onCreated={onCreated}
      />
    </Dialog>
  );
}

function CreateTenderForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { t, pickLocalized } = useT();
  const currentUser = useStore(
    (s) => s.users.find((u) => u.id === s.sessionUserId) ?? null,
  );

  const [tier, setTier] = useState<ProviderTier>("event");
  const [kind, setKind] = useState<ProviderKind>("photographer");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When tier changes, snap kind to the first option of that tier so the two
  // fields stay consistent (PROVIDER_TIER_OF is the source of truth).
  const handleTierChange = (next: ProviderTier) => {
    setTier(next);
    const firstMatching = KIND_OPTIONS.find((k) => PROVIDER_TIER_OF[k] === next);
    if (firstMatching) setKind(firstMatching);
  };

  // When kind changes, mirror its tier so radios remain in sync.
  const handleKindChange = (next: ProviderKind) => {
    setKind(next);
    setTier(PROVIDER_TIER_OF[next]);
  };

  const budgetMinNum = Number(budgetMin);
  const budgetMaxNum = Number(budgetMax);
  const ready =
    !!currentUser &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    Number.isFinite(budgetMinNum) &&
    budgetMinNum >= 0 &&
    Number.isFinite(budgetMaxNum) &&
    budgetMaxNum >= budgetMinNum &&
    deadline.length === 10 &&
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

      const created = await createTender({
        tier,
        kind,
        title: { az: title.trim(), ru: title.trim() },
        description: { az: description.trim(), ru: description.trim() },
        budgetMin: budgetMinNum,
        budgetMax: budgetMaxNum,
        deadline,
        tags,
        authorName: currentUser.name,
        district: { az: district.trim(), ru: district.trim() },
      });
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const todayMin = getTodayISO();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-h-[78vh] overflow-y-auto pr-1"
    >
        {!currentUser ? (
          <p className="text-sm text-pomegranate-500 leading-relaxed border border-pomegranate-200 bg-pomegranate-50 rounded-[10px] px-3 py-2">
            {t("tenders.create.notLoggedIn")}
          </p>
        ) : null}

        <div>
          <SectionLabel>{t("tenders.create.field.tier")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(["event", "beauty"] as const).map((opt) => {
              const active = tier === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleTierChange(opt)}
                  aria-pressed={active}
                  className={cn(
                    "h-10 px-4 rounded-full text-sm font-medium transition-colors border",
                    active
                      ? "bg-ink-900 text-white border-ink-900"
                      : "bg-surface text-ink-700 border-border-strong hover:bg-ink-50",
                  )}
                >
                  {t(`tier.${opt}`)}
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
            <SectionLabel>{t("tenders.create.field.deadline")}</SectionLabel>
            <Input
              type="date"
              min={todayMin}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
            placeholder="toy, banket, korporativ"
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
