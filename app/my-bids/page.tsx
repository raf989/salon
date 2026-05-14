"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Send, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { Dialog } from "@/components/ui/dialog";
import { BidStatusBadge } from "@/components/tenders/bid-status-badge";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useAuthResolved } from "@/lib/auth";
import {
  deleteBid,
  useMyBids,
  useTendersRealtime,
  type MyBid,
} from "@/lib/api/repo";
import { formatDate, formatPrice } from "@/lib/utils";

export default function MyBidsPage() {
  // Live: new tenders / bids land without F5.
  useTendersRealtime();
  const { t } = useT();
  const currentUserId = useStore((s) => s.sessionUserId);
  const bids = useMyBids(currentUserId ?? undefined);

  // `authResolved` is false on SSR + until FirebaseAuthSync settles the
  // first auth check. Gating on it (instead of a bare hydration flag)
  // means we never flash "not logged in" before the session is known.
  const authResolved = useAuthResolved();
  const isLoggedIn = !!currentUserId;
  const visible = bids;

  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 pb-24 pt-6">
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          { label: t("myBids.title") },
        ]}
        className="mb-6"
      />

      <header className="mb-8">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.015em] mb-2 flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-ink-400">
            <Send className="size-6 sm:size-7" strokeWidth={1.8} />
          </span>
          {t("myBids.title")}
          {visible.length > 0 ? (
            <span className="font-sans font-medium text-base text-ink-400">
              {visible.length}
            </span>
          ) : null}
        </h1>
        <p className="text-base text-ink-500 leading-relaxed">
          {t("myBids.subtitle")}
        </p>
      </header>

      {!authResolved ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
          <span className="size-9 rounded-full border-2 border-ink-200 border-t-caspian-500 animate-spin" />
        </Card>
      ) : !isLoggedIn ? (
        <EmptyState
          title={t("myBids.empty.title")}
          sub={t("myBids.empty.notLoggedIn")}
          loginCta
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("myBids.empty.title")}
          sub={t("myBids.empty.sub")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(({ bid, tender }) => (
            <BidRow key={bid.id} bid={bid} tender={tender} />
          ))}
        </div>
      )}
    </main>
  );
}

function BidRow({ bid, tender }: MyBid) {
  const { t, lang, pickLocalized } = useT();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteBid(bid.id);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  };

  // Only allow withdrawal while the author hasn't responded — a rejected /
  // accepted decision should be visible history, not undone unilaterally.
  // `undefined` (legacy bid before the migration) is treated as pending.
  const canWithdraw = (bid.status ?? "pending") === "pending";

  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-bg transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/tenders#${tender.id}`}
              className="font-display font-semibold text-base sm:text-lg text-ink-900 hover:text-caspian-600 transition-colors break-words sm:truncate min-w-0"
            >
              {pickLocalized(tender.title)}
            </Link>
            <BidStatusBadge status={bid.status} />
          </div>
          <div className="text-xs text-ink-500 font-mono">
            {formatDate(tender.eventDate ?? tender.deadline, lang)}
            {tender.eventTime ? ` · ${tender.eventTime}` : null}
          </div>
        </div>
        <div className="sm:text-right">
          <div className="font-mono font-semibold text-lg sm:text-xl text-ink-900 whitespace-nowrap">
            {formatPrice(bid.price)}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Avatar
          name={bid.providerName}
          id={bid.id}
          imageUrl={bid.providerAvatar}
          size="sm"
        />
        <p className="text-sm text-ink-500 leading-relaxed line-clamp-3 flex-1">
          {pickLocalized(bid.note)}
        </p>
      </div>

      <div className="flex justify-between items-center gap-2 flex-wrap">
        {canWithdraw ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-pomegranate-500 hover:bg-pomegranate-50"
            onClick={() => setConfirmOpen(true)}
          >
            <X className="size-3.5" />
            {t("myBids.withdraw")}
          </Button>
        ) : (
          <span />
        )}
        <Link href={`/tenders#${tender.id}`}>
          <Button variant="ghost" size="sm">
            {t("myBids.goToTender")}
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setError(null);
        }}
        title={t("myBids.withdraw.confirm")}
      >
        <div className="flex flex-col gap-3">
          {error ? (
            <p className="text-sm text-pomegranate-500 leading-relaxed">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              {t("myBids.withdraw.confirmNo")}
            </Button>
            <Button
              type="button"
              variant="urgent"
              size="lg"
              onClick={handleWithdraw}
              disabled={deleting}
            >
              {t("myBids.withdraw.confirmYes")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

function EmptyState({
  title,
  sub,
  loginCta,
}: {
  title: string;
  sub: string;
  loginCta?: boolean;
}) {
  const { t } = useT();
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
      <span className="size-12 rounded-full bg-ink-50 grid place-items-center text-ink-500">
        <Send className="size-5" />
      </span>
      <p className="font-display font-semibold text-lg text-ink-800">{title}</p>
      <p className="text-ink-500 max-w-md text-sm">{sub}</p>
      {loginCta ? (
        <Link href="/login">
          <Button variant="primary" size="sm" className="mt-2">
            {t("nav.login")}
          </Button>
        </Link>
      ) : (
        <Link href="/tenders">
          <Button variant="outline" size="sm" className="mt-2">
            {t("nav.tenders")}
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      )}
    </Card>
  );
}
