"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { submitBid, useProviders } from "@/lib/api/repo";
import { formatPrice } from "@/lib/utils";
import type { Tender } from "@/lib/types";

type Props = {
  tender: Tender;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function SubmitBidModal({ tender, open, onClose, onSubmitted }: Props) {
  const { t } = useT();
  return (
    <Dialog open={open} onClose={onClose} title={t("tenders.bid.title")}>
      {/* Keyed inner form remounts on each open so prior input doesn't linger. */}
      <SubmitBidForm
        key={open ? `open-${tender.id}` : "closed"}
        tender={tender}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />
    </Dialog>
  );
}

function SubmitBidForm({
  tender,
  onClose,
  onSubmitted,
}: {
  tender: Tender;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const { t, pickLocalized } = useT();
  const currentUser = useStore(
    (s) => s.users.find((u) => u.id === s.sessionUserId) ?? null,
  );
  // Pull "my" avatar from the same place the dashboard does — providers[0]
  // is what /dashboard treats as the current user until real auth↔provider
  // linkage exists. We snapshot the URL onto the bid so cards can show a
  // photo even though tender_bids has no FK back to providers.
  const myAvatar = useProviders()[0]?.avatar;

  const [price, setPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [providerName, setProviderName] = useState<string>(
    currentUser?.name ?? "",
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const priceNumber = Number(price);
  const ready =
    providerName.trim().length > 0 &&
    note.trim().length > 0 &&
    Number.isFinite(priceNumber) &&
    priceNumber > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitBid(tender.id, {
        // Auth user IDs (`users` table) aren't the same as `providers.id` —
        // the FK on tender_bids.provider_id only accepts rows from `providers`.
        // We keep providerId empty (→ NULL) and stash the local auth user id
        // in `authorUserId` so "my bids" UI can resolve later.
        providerId: "",
        authorUserId: currentUser?.id,
        providerName: providerName.trim(),
        providerAvatar: myAvatar,
        price: priceNumber,
        note: { az: note.trim(), ru: note.trim() },
        badges: [],
      });
      setDone(true);
      onSubmitted?.();
      // Brief success flash, then close.
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-500 leading-relaxed -mt-1">
        {pickLocalized(tender.title)}
        <span className="text-ink-300"> · </span>
        <span className="font-mono text-ink-700">
          {formatPrice(tender.budgetMin)}–{formatPrice(tender.budgetMax)}
        </span>
      </p>

      <div>
        <SectionLabel>{t("booking.nameLabel")}</SectionLabel>
        <Input
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder={t("booking.namePlaceholder")}
          disabled={submitting || done}
        />
      </div>

      <div>
        <SectionLabel>{t("tenders.bid.price")}</SectionLabel>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          disabled={submitting || done}
        />
      </div>

      <div>
        <SectionLabel>{t("tenders.bid.note")}</SectionLabel>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          disabled={submitting || done}
          className="w-full rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)] disabled:opacity-50 disabled:pointer-events-none resize-none"
        />
      </div>

      {error ? (
        <p className="text-sm text-pomegranate-500 leading-relaxed">{error}</p>
      ) : null}

      {done ? (
        <p className="text-sm text-caspian-600 leading-relaxed font-medium">
          {t("tenders.bid.success")}
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
          disabled={!ready || submitting || done}
        >
          {submitting
            ? t("tenders.bid.submitting")
            : t("tenders.bid.submit")}
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
