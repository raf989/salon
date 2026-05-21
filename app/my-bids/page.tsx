"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Send, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { Dialog } from "@/components/ui/dialog";
import { AnimatedCounter } from "@/components/ui/animated-counter";
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

  const stats = useMemo(() => {
    let accepted = 0;
    let pending = 0;
    for (const item of visible) {
      const s = item.bid.status ?? "pending";
      if (s === "accepted") accepted += 1;
      else if (s === "pending") pending += 1;
    }
    return { total: visible.length, accepted, pending };
  }, [visible]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-4xl px-4 md:px-6 pb-24 pt-6"
    >
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          { label: t("myBids.title") },
        ]}
        className="mb-6"
      />

      <header className="mb-8">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.015em] mb-2 flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-grid place-items-center size-9 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
            <Send className="size-4 sm:size-5" strokeWidth={2} />
          </span>
          {t("myBids.title")}
        </h1>
        <p className="text-base text-ink-500 leading-relaxed">
          {t("myBids.subtitle")}
        </p>
      </header>

      {isLoggedIn && visible.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <StatCard
            label={t("myBids.stat.total")}
            value={stats.total}
            accent="violet"
            icon={<Send className="size-4" strokeWidth={2} />}
          />
          <StatCard
            label={t("myBids.stat.accepted")}
            value={stats.accepted}
            accent="success"
            icon={<CheckCircle2 className="size-4" strokeWidth={2} />}
          />
          <StatCard
            label={t("myBids.stat.pending")}
            value={stats.pending}
            accent="gold"
            icon={<Clock className="size-4" strokeWidth={2} />}
          />
        </motion.div>
      ) : null}

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
    </motion.main>
  );
}

type AccentKey = "violet" | "success" | "gold";

const ACCENT_CLASSES: Record<AccentKey, string> = {
  violet:
    "bg-violet-500/15 border-violet-500/30 text-violet-300",
  success:
    "bg-success-500/15 border-success-500/30 text-success-500",
  gold: "bg-gold-500/15 border-gold-500/30 text-gold-400",
};

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: AccentKey;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl border border-border-strong p-3 sm:p-4 flex items-center gap-3 hover:-translate-y-px hover:border-violet-500/40 transition-all">
      <span
        className={`inline-grid place-items-center size-9 rounded-full border ${ACCENT_CLASSES[accent]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <AnimatedCounter
          to={value}
          className="font-display font-semibold text-2xl text-ink-900 font-mono leading-none"
        />
        <div className="text-[11px] uppercase tracking-[0.16em] text-ink-500 mt-1">
          {label}
        </div>
      </div>
    </div>
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
      const msg = err instanceof Error ? err.message : String(err);
      // deleteBid throws BID_NOT_PENDING when the author accepted/rejected
      // the bid before the withdraw landed — explain it instead of showing
      // the raw marker string.
      setError(
        msg === "BID_NOT_PENDING"
          ? lang === "ru"
            ? "Ставку уже приняли или отклонили — отозвать нельзя."
            : "Təklif artıq qəbul və ya rədd edilib — geri götürmək olmur."
          : msg,
      );
    } finally {
      setDeleting(false);
    }
  };

  // Only allow withdrawal while the author hasn't responded — a rejected /
  // accepted decision should be visible history, not undone unilaterally.
  // `undefined` (legacy bid before the migration) is treated as pending.
  const canWithdraw = (bid.status ?? "pending") === "pending";

  const status = bid.status ?? "pending";
  const glowClass =
    status === "accepted"
      ? "hover:shadow-[var(--sh-glow-cyan)] hover:border-success-500/40"
      : status === "rejected"
        ? "hover:border-danger-500/40"
        : "hover:shadow-[var(--sh-glow-violet)] hover:border-violet-500/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`glass border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all hover:-translate-y-px ${glowClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/tenders#${tender.id}`}
              className="font-display font-semibold text-base sm:text-lg text-ink-900 hover:text-violet-300 transition-colors break-words sm:truncate min-w-0"
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
            className="text-danger-500 hover:bg-danger-500/10"
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
            <p className="text-sm text-danger-500 leading-relaxed">{error}</p>
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
    </motion.div>
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
    <Card className="relative overflow-hidden flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="size-14 rounded-full glass border border-border-strong grid place-items-center text-violet-300 shadow-[var(--sh-glow-violet)]"
      >
        <Send className="size-6" strokeWidth={1.8} />
      </motion.span>
      <p className="font-display font-semibold text-lg text-ink-800 relative z-10 mt-1">
        {title}
      </p>
      <p className="text-ink-500 max-w-md text-sm relative z-10">{sub}</p>
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
