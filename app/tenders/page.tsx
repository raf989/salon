"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileSearch, Flame, Plus, Timer } from "lucide-react";
import { useTendersRealtime, useTendersWithStatus } from "@/lib/api/repo";
import {
  SkeletonTenderCard,
  SkeletonTenderCardCompact,
} from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/store";
import { useAuthResolved } from "@/lib/auth";
import { useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

// ms remaining → human readable urgency label
function formatRemaining(ms: number): { text: string; urgent: boolean } {
  if (ms <= 0) return { text: "Closed", urgent: false };
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return { text: `Closes in ${days}d`, urgent: false };
  if (hours >= 1) {
    const remM = minutes - hours * 60;
    return {
      text: `Closes in ${hours}h ${remM}m`,
      urgent: hours < 1,
    };
  }
  return { text: `Closes in ${minutes}m`, urgent: true };
}

function UrgencyPill({ deadline }: { deadline: number }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = deadline - now;
  const { text, urgent } = formatRemaining(remaining);
  return (
    <div
      className={cn(
        "absolute top-3 right-3 z-10 inline-flex items-center gap-1 h-6 px-2 rounded-full",
        "text-[11px] font-medium font-mono whitespace-nowrap",
        "bg-magenta-500/15 border border-magenta-500/30 text-magenta-300",
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

  // Resolve the current user's display name to scope the "Мои" filter.
  // Gate on `authResolved` (not a bare hydration flag): until the session
  // + profile have settled, `currentUser` is null for everyone, which
  // would make "Мои" flash empty for a logged-in author on first paint.
  const currentUserName = useCurrentUser()?.name ?? null;
  const authResolved = useAuthResolved();
  const mineAuthor = authResolved ? currentUserName : null;

  const filtered = useMemo(() => {
    if (filter === "all") return tenders;
    if (filter === "mine") {
      if (!mineAuthor) return [];
      return tenders.filter((tender) => tender.authorName === mineAuthor);
    }
    return tenders.filter((tender) => tender.tier === filter);
  }, [filter, tenders, mineAuthor]);

  const [featured, ...rest] = filtered;

  // Build a stable mock deadline for each tender so the urgency timer
  // always has a value to render. We use a per-id base time so it doesn't
  // jitter between renders.
  const deadlineFor = useMemo(() => {
    const map = new Map<string, number>();
    const base = Date.now();
    tenders.forEach((t, i) => {
      // Spread between ~30min and a few days out so we see a mix.
      const offset = (i + 1) * 3_600_000; // i+1 hours from now
      map.set(t.id, base + offset);
    });
    return map;
  }, [tenders]);

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
            <span className="text-sm text-ink-500">open tenders</span>
          </div>
          <span aria-hidden className="text-ink-400">
            ·
          </span>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              to={stats.activeVendors}
              className="font-display font-semibold text-2xl text-ink-900 font-mono"
            />
            <span className="text-sm text-ink-500">active vendors</span>
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
              Hot tenders right now
            </h2>
          </div>
          <Carousel autoplay snap="center" showArrows>
            {hotTenders.map((tender) => {
              const dl = deadlineFor.get(tender.id) ?? Date.now() + 3_600_000;
              return (
                <div
                  key={tender.id}
                  className="relative w-[320px] sm:w-[360px] md:w-[400px]"
                >
                  <UrgencyPill deadline={dl} />
                  <TenderCardCompact tender={tender} />
                </div>
              );
            })}
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
                {rest.map((tender) => {
                  const dl =
                    deadlineFor.get(tender.id) ?? Date.now() + 3_600_000;
                  return (
                    <div key={tender.id} className="relative">
                      <UrgencyPill deadline={dl} />
                      <TenderCardCompact tender={tender} />
                    </div>
                  );
                })}
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
