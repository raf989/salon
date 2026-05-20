"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Heart, Send, Sparkles } from "lucide-react";
import { BookingModal } from "@/components/client/booking-modal";
import { ProviderRow } from "@/components/client/provider-row";
import { TenderCardCompact } from "@/components/tenders/tender-card-compact";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { BidStatusBadge } from "@/components/tenders/bid-status-badge";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  useAppointments,
  useAppointmentsRealtime,
  useMyBids,
  useProvidersWithStatus,
  useTendersWithStatus,
  useTendersRealtime,
} from "@/lib/api/repo";
import { hasFreeSlotOnDate } from "@/lib/availability";
import { useNow } from "@/lib/use-now";
import { getTodayISO, formatDate, formatPrice } from "@/lib/utils";
import type { Provider } from "@/lib/types";

type TabKey = "providers" | "tenders" | "bids";

export default function FavoritesPage() {
  // Live-refresh saved tenders and "available today" badge as new bookings
  // and tender activity happen elsewhere.
  useTendersRealtime();
  useAppointmentsRealtime();
  const { t, lang, pickLocalized } = useT();
  const { providers, loaded: providersLoaded } = useProvidersWithStatus();
  const { tenders, loaded: tendersLoaded } = useTendersWithStatus();
  const todayISO = getTodayISO();
  const appointments = useAppointments({ date: todayISO });

  // Favourites live in localStorage — only available client-side. Render an
  // empty state during SSR + the first client tick to avoid SSR/CSR mismatch.
  const favProviderIds = useStore((s) => s.favoriteProviderIds);
  const favTenderIds = useStore((s) => s.favoriteTenderIds);
  const sessionUserId = useStore((s) => s.sessionUserId);
  const myBids = useMyBids(sessionUserId ?? undefined);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const favProviders = useMemo(() => {
    if (!hydrated) return [];
    const set = new Set(favProviderIds);
    return providers.filter((p) => set.has(p.id));
  }, [providers, favProviderIds, hydrated]);

  const favTenders = useMemo(() => {
    if (!hydrated) return [];
    const set = new Set(favTenderIds);
    return tenders.filter((tender) => set.has(tender.id));
  }, [tenders, favTenderIds, hydrated]);

  // Match the catalog: "available today" badge / "Записаться сейчас" CTA
  // should reflect actual openness, not a hard-coded false. Shared clock
  // means the badge flips live without a page reload.
  const now = useNow();
  const availabilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of favProviders) {
      map[p.id] = hasFreeSlotOnDate(p, todayISO, appointments, todayISO, now);
    }
    return map;
  }, [favProviders, appointments, todayISO, now]);

  const [booking, setBooking] = useState<Provider | null>(null);
  const [tab, setTab] = useState<TabKey>("providers");

  // Favourites are localStorage IDs; resolving them to cards needs the
  // providers/tenders lists. Until both have loaded we can't tell "no
  // favourites" from "still loading" — show a skeleton, not the empty state.
  const dataReady = hydrated && providersLoaded && tendersLoaded;
  const totalSaved =
    favProviders.length + favTenders.length + (myBids?.length ?? 0);

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
          { label: t("favorites.title") },
        ]}
        className="mb-6"
      />

      {/* Hero strip */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass-strong rounded-2xl border border-border-strong px-6 py-6 sm:py-7 mb-8 relative overflow-hidden"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,61,157,0.20), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-grid place-items-center size-7 rounded-full bg-magenta-500/15 border border-magenta-500/30 text-magenta-300">
                <Heart className="size-4" strokeWidth={2} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-magenta-300">
                {t("favorites.title")}
              </span>
            </div>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl text-ink-900 leading-tight tracking-[-0.015em] break-words">
              {t("favorites.title")}
            </h1>
            <p className="text-base text-ink-500 leading-relaxed mt-2 max-w-xl">
              {t("favorites.subtitle")}
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              to={totalSaved}
              className="font-display font-semibold text-4xl text-ink-900 font-mono gradient-text-aurora"
            />
            <span className="text-sm text-ink-500">saved</span>
          </div>
        </div>
      </motion.section>

      {!dataReady ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
          <span className="size-9 rounded-full border-2 border-ink-300 border-t-violet-500 animate-spin" />
        </Card>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="mt-2"
        >
          <TabsList>
            <TabsTrigger value="providers">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="size-3.5" strokeWidth={2} />
                {t("favorites.section.providers")}
                <span className="ml-1 text-xs text-ink-400 font-mono">
                  {favProviders.length}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="tenders">
              <span className="inline-flex items-center gap-1.5">
                <Bookmark className="size-3.5" strokeWidth={2} />
                {t("favorites.section.tenders")}
                <span className="ml-1 text-xs text-ink-400 font-mono">
                  {favTenders.length}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="bids">
              <span className="inline-flex items-center gap-1.5">
                <Send className="size-3.5" strokeWidth={2} />
                {t("favorites.section.myBids")}
                <span className="ml-1 text-xs text-ink-400 font-mono">
                  {myBids?.length ?? 0}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers">
            <FilterBar />
            {favProviders.length === 0 ? (
              <EmptyState
                icon={<Heart className="size-5" />}
                title={t("favorites.empty.title")}
                sub={t("favorites.empty.sub")}
              />
            ) : (
              <div className="space-y-3">
                {favProviders.map((p) => (
                  <ProviderRow
                    key={p.id}
                    provider={p}
                    onBook={setBooking}
                    availableToday={availabilityMap[p.id] ?? false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tenders">
            <FilterBar />
            {favTenders.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="size-5" />}
                title={t("favorites.empty.title")}
                sub={t("favorites.empty.sub")}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favTenders.map((tender) => (
                  <TenderCardCompact key={tender.id} tender={tender} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bids">
            <FilterBar />
            {!sessionUserId ? (
              <EmptyState
                icon={<Send className="size-5" />}
                title={t("myBids.empty.title")}
                sub={t("myBids.empty.notLoggedIn")}
              />
            ) : !myBids || myBids.length === 0 ? (
              <EmptyState
                icon={<Send className="size-5" />}
                title={t("myBids.empty.title")}
                sub={t("myBids.empty.sub")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {myBids.slice(0, 8).map(({ bid, tender }) => (
                  <Card
                    key={bid.id}
                    className="p-4 sm:p-5 glass border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/tenders#${tender.id}`}
                          className="font-display font-semibold text-base text-ink-900 hover:text-violet-300 transition-colors truncate"
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
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-semibold text-lg text-ink-900 whitespace-nowrap">
                        {formatPrice(bid.price)}
                      </div>
                      <Link href={`/tenders#${tender.id}`}>
                        <Button variant="ghost" size="sm">
                          {t("myBids.goToTender")}
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
                <div className="flex justify-end mt-2">
                  <Link href="/my-bids">
                    <Button variant="outline" size="sm">
                      {t("nav.myBids")}
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </motion.main>
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="search"
        placeholder="Search…"
        className="h-9 flex-1 min-w-[180px] sm:max-w-xs px-3 rounded-md bg-surface-2 border border-border-strong text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-violet-500/60 focus:shadow-[var(--sh-glow-violet)] transition-colors"
      />
      <select
        defaultValue="recent"
        className="h-9 px-3 rounded-md bg-surface-2 border border-border-strong text-sm text-ink-700 focus:outline-none focus:border-violet-500/60 transition-colors"
      >
        <option value="recent">Sort: recent</option>
        <option value="rating">Sort: rating</option>
        <option value="name">Sort: name</option>
      </select>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Card className="relative overflow-hidden flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
        animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -top-6 -right-4 text-magenta-400/40"
      >
        <Sparkles className="size-14 float-y" strokeWidth={1.4} />
      </motion.span>
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.6, rotate: 20 }}
        animate={{ opacity: 0.7, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -bottom-4 -left-2 text-violet-400/40"
      >
        <Sparkles className="size-10 float-y" strokeWidth={1.4} />
      </motion.span>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="size-12 rounded-full glass grid place-items-center text-ink-500 border border-border-strong"
      >
        {icon}
      </motion.span>
      <p className="font-display font-semibold text-lg text-ink-800 relative z-10">
        {title}
      </p>
      <p className="text-ink-500 max-w-md text-sm relative z-10">{sub}</p>
    </Card>
  );
}
