"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { BookingModal } from "@/components/client/booking-modal";
import { ProviderRow } from "@/components/client/provider-row";
import { TenderCardCompact } from "@/components/tenders/tender-card-compact";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  useAppointments,
  useAppointmentsRealtime,
  useProvidersWithStatus,
  useTendersWithStatus,
  useTendersRealtime,
} from "@/lib/api/repo";
import { hasFreeSlotOnDate } from "@/lib/availability";
import { useNow } from "@/lib/use-now";
import { getTodayISO } from "@/lib/utils";
import type { Provider } from "@/lib/types";

export default function FavoritesPage() {
  // Live-refresh saved tenders and "available today" badge as new bookings
  // and tender activity happen elsewhere.
  useTendersRealtime();
  useAppointmentsRealtime();
  const { t } = useT();
  const { providers, loaded: providersLoaded } = useProvidersWithStatus();
  const { tenders, loaded: tendersLoaded } = useTendersWithStatus();
  const todayISO = getTodayISO();
  const appointments = useAppointments({ date: todayISO });

  // Favourites live in localStorage — only available client-side. Render an
  // empty state during SSR + the first client tick to avoid SSR/CSR mismatch.
  const favProviderIds = useStore((s) => s.favoriteProviderIds);
  const favTenderIds = useStore((s) => s.favoriteTenderIds);
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

  // Favourites are localStorage IDs; resolving them to cards needs the
  // providers/tenders lists. Until both have loaded we can't tell "no
  // favourites" from "still loading" — show a skeleton, not the empty state.
  const dataReady = hydrated && providersLoaded && tendersLoaded;
  const nothing =
    dataReady && favProviders.length === 0 && favTenders.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6">
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          { label: t("favorites.title") },
        ]}
        className="mb-6"
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.015em] mb-2 break-words">
          {t("favorites.title")}
        </h1>
        <p className="text-base text-ink-500 leading-relaxed">
          {t("favorites.subtitle")}
        </p>
      </header>

      {!dataReady ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
          <span className="size-9 rounded-full border-2 border-ink-200 border-t-caspian-500 animate-spin" />
        </Card>
      ) : nothing ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-10">
          {favProviders.length > 0 ? (
            <section>
              <SectionHeading
                icon={<Heart className="size-4" strokeWidth={1.8} />}
                label={t("favorites.section.providers")}
                count={favProviders.length}
              />
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
            </section>
          ) : null}

          {favTenders.length > 0 ? (
            <section>
              <SectionHeading
                icon={<Bookmark className="size-4" strokeWidth={1.8} />}
                label={t("favorites.section.tenders")}
                count={favTenders.length}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favTenders.map((tender) => (
                  <TenderCardCompact key={tender.id} tender={tender} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </main>
  );
}

function SectionHeading({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <h2 className="font-display font-semibold text-xl text-ink-800 mb-4 flex items-center gap-2">
      <span className="text-ink-400">{icon}</span>
      {label}
      <span className="font-sans font-medium text-base text-ink-400">
        {count}
      </span>
    </h2>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center border-dashed">
      <span className="size-12 rounded-full bg-ink-50 grid place-items-center text-ink-500">
        <Heart className="size-5" />
      </span>
      <p className="font-display font-semibold text-lg text-ink-800">
        {t("favorites.empty.title")}
      </p>
      <p className="text-ink-500 max-w-md text-sm">
        {t("favorites.empty.sub")}
      </p>
    </Card>
  );
}
