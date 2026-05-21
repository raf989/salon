"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileSearch, Flame, Plus, Timer } from "lucide-react";
import { useTendersRealtime, useTendersWithStatus } from "@/lib/api/repo";
import {
  SkeletonTenderCard,
  SkeletonTenderCardCompact,
} from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { useAuthResolved } from "@/lib/auth";
import { useT, type DictKey } from "@/lib/i18n";
import { cn, getTodayISO } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionHeader } from "@/components/ui/section-header";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Carousel } from "@/components/ui/carousel";
import { TenderCard } from "@/components/tenders/tender-card";
import { TenderCardCompact } from "@/components/tenders/tender-card-compact";
import { BidsPanel } from "@/components/tenders/bids-panel";
import { CreateTenderModal } from "@/components/tenders/create-tender-modal";

type FilterKey = "all" | "event" | "mine";

const FILTER_KEYS: ReadonlyArray<FilterKey> = ["all", "event", "mine"];

// Whole-day difference between two YYYY-MM-DD dates (deadline − today).
function daysUntil(deadlineISO: string, todayISO: string): number {
  const d = new Date(`${deadlineISO}T00:00:00`).getTime();
  const t = new Date(`${todayISO}T00:00:00`).getTime();
  return Math.round((d - t) / 86_400_000);
}

// Deadline pill driven by the tender's real `deadline` date. Renders nothing
// until mounted so the server HTML never disagrees with the client (the day
// count depends on the local clock). The old version generated a fake
// per-render `Date.now()` deadline that never counted down and caused an
// SSR/CSR hydration mismatch.
function UrgencyPill({ deadline }: { deadline: string }) {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const days = daysUntil(deadline, getTodayISO());
  const closed = days < 0;
  // "Urgent" = closes today or tomorrow — when the pulse earns its attention.
  const urgent = !closed && days <= 1;
  const text = closed
    ? t("tenders.deadline.closed")
    : days === 0
      ? t("tenders.deadline.today")
      : t("tenders.deadline.inDays").replace("{n}", String(days));
  return (
    <div
      className={cn(
        "absolute top-3 right-3 z-10 inline-flex items-center gap-1 h-6 px-2 rounded-full",
        "text-[11px] font-medium font-mono whitespace-nowrap",
        closed
          ? "bg-ink-50 border border-border-strong text-ink-400"
          : "bg-magenta-500/15 border border-magenta-500/30 text-magenta-300",
        urgent && "animate-pulse shadow-[var(--sh-glow-magenta)]",
      )}
    >
      <Timer className="size-3" strokeWidth={2} />
      {text}
    </div>
  );
}

export default function TendersPage() {
  // Live-refresh when new tenders / bids land — same UX as a Twitter feed.
  useTendersRealtime();
  const { t } = useT();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const { tenders, loaded: tendersLoaded } = useTendersWithStatus();

  // Scope the "Мои" filter by Firebase UID, not display name — names
  // collide between users and break the filter the moment someone renames
  // their profile. Gate on `authResolved` so the list doesn't flash empty
  // for a logged-in author during the auth handshake.
  const sessionUserId = useStore((s) => s.sessionUserId);
  const authResolved = useAuthResolved();

  const filtered = useMemo(() => {
    if (filter === "all") return tenders;
    if (filter === "mine") {
      if (!authResolved || !sessionUserId) return [];
      return tenders.filter((tender) => tender.authUserId === sessionUserId);
    }
    return tenders.filter((tender) => tender.tier === filter);
  }, [filter, tenders, authResolved, sessionUserId]);

  const [featured, ...rest] = filtered;

  // Hot tenders: top 3-4 by ordering position in the loaded list.
  const hotTenders = useMemo(() => tenders.slice(0, 4), [tenders]);

  // Stats: open tenders, active vendors (unique bidders across tenders).
  const stats = useMemo(() => {
    const openTenders = tenders.length;
    const vendorSet = new Set<string>();
    for (const tnd of tenders) {
      for (const bid of tnd.bids ?? []) {
        vendorSet.add(bid.providerName);
      }
    }
    return { openTenders, activeVendors: vendorSet.size };
  }, [tenders]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6"
    >
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          { label: t("nav.tenders") },
        ]}
        className="mb-6"
      />

      <header className="mb-8 max-w-3xl">
        <Eyebrow className="mb-3">{t("hero.eyebrow")}</Eyebrow>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-ink-900 leading-[1.1] sm:leading-[1.05] tracking-[-0.02em] mb-3 break-words">
          {t("tenders.title")}
        </h1>
        <p className="text-base md:text-lg text-ink-500 leading-relaxed">
          {t("tenders.subtitle")}
        </p>
      </header>

      {tendersLoaded && tenders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass rounded-2xl border border-border-strong px-5 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              to={stats.openTenders}
              className="font-display font-semibold text-2xl text-ink-900 font-mono"
            />
            <span className="text-sm text-ink-500">
              {t("tenders.stats.open")}
            </span>
          </div>
          <span aria-hidden className="text-ink-400">
            ·
          </span>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              to={stats.activeVendors}
              className="font-display font-semibold text-2xl text-ink-900 font-mono"
            />
            <span className="text-sm text-ink-500">
              {t("tenders.stats.vendors")}
            </span>
          </div>
        </motion.div>
      ) : null}

      {tendersLoaded && hotTenders.length > 0 ? (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-grid place-items-center size-7 rounded-full bg-magenta-500/15 border border-magenta-500/30 text-magenta-300">
              <Flame className="size-4" strokeWidth={2} />
            </span>
            <h2 className="font-display font-semibold text-xl text-ink-900 tracking-tight">
              {t("tenders.hot")}
            </h2>
          </div>
          <Carousel autoplay snap="center" showArrows>
            {hotTenders.map((tender) => (
              <div
                key={tender.id}
                className="relative w-[320px] sm:w-[360px] md:w-[400px]"
              >
                <UrgencyPill deadline={tender.deadline} />
                <TenderCardCompact tender={tender} />
              </div>
            ))}
          </Carousel>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 mt-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
          {FILTER_KEYS.map((key) => {
            const active = filter === key;
            const labelKey = `tenders.filters.${key}` as DictKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={cn(
                  "h-10 sm:h-9 px-4 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-ink-900 text-white"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100",
                )}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="order-1 sm:order-2 w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-1.5 h-11 sm:h-9 px-4 rounded-full text-sm font-semibold bg-caspian-500 text-white hover:bg-caspian-600 transition-colors"
        >
          <Plus className="size-4" strokeWidth={2} />
          {t("tenders.create.title")}
        </button>
      </div>

      {!tendersLoaded ? (
        <div className="space-y-12">
          <SkeletonTenderCard />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonTenderCardCompact key={i} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
          <span className="size-12 rounded-full bg-ink-50 grid place-items-center text-ink-500">
            <FileSearch className="size-5" />
          </span>
          <p className="text-ink-500 max-w-md text-sm">
            {t("tenders.empty")}
          </p>
        </Card>
      ) : (
        <>
          {featured ? (
            <section className="mb-12">
              <SectionHeader title={t("tenders.featured")} />
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <TenderCard tender={featured} />
                <BidsPanel tender={featured} />
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section>
              <SectionHeader title={t("tenders.allTenders")} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((tender) => (
                  <div key={tender.id} className="relative">
                    <UrgencyPill deadline={tender.deadline} />
                    <TenderCardCompact tender={tender} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <CreateTenderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </motion.main>
  );
}
