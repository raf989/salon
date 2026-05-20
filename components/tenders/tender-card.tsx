"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { useT, type DictKey } from "@/lib/i18n";
import type { Tender } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate, formatPrice, getTodayISO } from "@/lib/utils";
import { SubmitBidModal } from "@/components/tenders/submit-bid-modal";
import { FavoriteToggle } from "@/components/tenders/favorite-toggle";
import { CreateTenderModal } from "@/components/tenders/create-tender-modal";
import { deleteTender } from "@/lib/api/repo";
import { useStore } from "@/lib/store";

type Props = { tender: Tender };

const BLOB_STYLE = {
  background:
    "radial-gradient(circle, rgba(155,108,246,0.18), transparent 70%)",
} as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function computeMinutesAgo(openedAt: string, id: string): number {
  if (openedAt === getTodayISO()) {
    return (hashId(id) % 50) + 8;
  }
  // Older tenders: present as some larger value bucketed by hash (still "minutes ago" stylistically)
  return (hashId(id) % 180) + 60;
}

export function TenderCard({ tender }: Props) {
  const { t, lang, pickLocalized } = useT();
  const [bidOpen, setBidOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Authoring controls are gated on a strong owner check — the Firebase UID
  // on the tender row must match the signed-in user. The name-based check
  // we previously used could collide on common names and would break the
  // moment a user renamed their profile.
  const sessionUserId = useStore((s) => s.sessionUserId);
  const isAuthor =
    !!sessionUserId &&
    !!tender.authUserId &&
    tender.authUserId === sessionUserId;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTender(tender.id);
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  };

  const tierKey = `tier.${tender.tier}` as DictKey;
  const tierBadge = `${t("tenders.tenderBadge")} · ${t(tierKey)}`;
  const minutesAgo = computeMinutesAgo(tender.openedAt, tender.id);
  const openedAgo = t("tenders.openedAgo").replace("{n}", String(minutesAgo));
  const bidsLabel = t("tenders.bidsCount").replace(
    "{n}",
    String(tender.bidsCount),
  );
  const budgetLine = `${t("tenders.budget")}: ${formatPrice(tender.budgetMin)}–${formatPrice(tender.budgetMax)}`;
  // Lexical compare is safe — both sides are ISO 'YYYY-MM-DD'.
  const isClosed = tender.deadline < getTodayISO();

  return (
    <motion.div
      id={tender.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border-strong bg-surface/70 backdrop-blur-md p-5 sm:p-6 md:p-7 scroll-mt-20 transition hover:border-violet-500/40 hover:shadow-[var(--sh-glow-violet)] hover:-translate-y-px"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full"
        style={BLOB_STYLE}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-xs font-medium text-violet-300">
            {tierBadge}
          </span>
          <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-xs font-mono text-violet-300 whitespace-nowrap">
            {openedAgo} · {bidsLabel}
          </span>
        </div>

        <h2 className="font-display font-semibold text-xl sm:text-2xl md:text-[32px] tracking-[-0.015em] leading-[1.2] text-ink-900 mt-3 break-words">
          {pickLocalized(tender.title)}
        </h2>

        <p className="text-ink-700 mt-3 leading-relaxed">
          {pickLocalized(tender.description)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 font-mono whitespace-nowrap">
            {budgetLine}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-violet-400" strokeWidth={1.7} />
            <span className="text-ink-700">{pickLocalized(tender.district)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-violet-400" strokeWidth={1.7} />
            <span className="text-ink-700">
              {formatDate(tender.eventDate ?? tender.deadline, lang)}
              {tender.eventTime ? ` · ${tender.eventTime}` : null}
            </span>
          </span>
          <span className="text-ink-500">
            {t("tenders.author")}: <span className="text-ink-700">{tender.authorName}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-5">
          {tender.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center h-7 px-2.5 rounded-full bg-surface-2/60 border border-border-strong text-xs font-medium text-ink-700"
            >
              {pickLocalized(tag)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          {isAuthor ? (
            // Author view: edit / delete; bidding on your own tender
            // makes no sense and "save to favorites" is awkward, so
            // those CTAs are hidden.
            <>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
                {t("tenders.action.edit")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDeleteOpen(true)}
                className="text-danger-500 border-danger-500/30 hover:bg-danger-500/10"
              >
                <Trash2 className="size-4" />
                {t("tenders.action.delete")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={() => setBidOpen(true)}
                disabled={isClosed}
                title={isClosed ? t("tenders.bid.deadlinePassed") : undefined}
              >
                {t("tenders.action.bid")}
              </Button>
              <FavoriteToggle tenderId={tender.id} />
            </>
          )}
        </div>
      </div>
      <SubmitBidModal
        tender={tender}
        open={bidOpen}
        onClose={() => setBidOpen(false)}
      />
      {isAuthor ? (
        <>
          <CreateTenderModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            existing={tender}
          />
          <Dialog
            open={deleteOpen}
            onClose={() => {
              if (deleting) return;
              setDeleteOpen(false);
              setDeleteError(null);
            }}
            title={t("tenders.delete.confirm.title")}
          >
            <p className="text-sm text-ink-700 leading-relaxed">
              {t("tenders.delete.confirm.body")}
            </p>
            {deleteError ? (
              <p className="mt-3 text-sm text-danger-500" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                {t("tenders.delete.confirm.no")}
              </Button>
              <Button
                type="button"
                variant="urgent"
                onClick={handleDelete}
                disabled={deleting}
              >
                {t("tenders.delete.confirm.yes")}
              </Button>
            </div>
          </Dialog>
        </>
      ) : null}
    </motion.div>
  );
}
