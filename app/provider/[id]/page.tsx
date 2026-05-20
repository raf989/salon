"use client";

import { use, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { BookingModal } from "@/components/client/booking-modal";
import { ProviderRow } from "@/components/client/provider-row";
import { Crumbs } from "@/components/ui/crumbs";
import { Carousel } from "@/components/ui/carousel";
import { AboutSection } from "@/components/provider/about-section";
import { GalleryGrid } from "@/components/provider/gallery-grid";
import { PriceList } from "@/components/provider/price-list";
import { ProfileHero } from "@/components/provider/profile-hero";
import { Reviews } from "@/components/provider/reviews";
import { StickyBooking } from "@/components/provider/sticky-booking";
import { SkeletonProviderPage } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import {
  useAppointments,
  useProviderBySlugWithStatus,
  useProvidersWithStatus,
} from "@/lib/api/repo";
import { hasFreeSlotOnDate } from "@/lib/availability";
import { generateSlots, isInBreak, isSlotPast, toMinutes } from "@/lib/slots";
import { useNow } from "@/lib/use-now";
import { KIND_PLURAL, type Provider } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";

export default function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProviderPageInner id={id} />;
}

function ProviderPageInner({ id }: { id: string }) {
  const { t, pickLocalized } = useT();
  // The folder is still [id] for URL stability, but the value is treated as
  // a slug — UUIDs aren't shareable.
  const { provider, loaded } = useProviderBySlugWithStatus(id);
  // Hard 5s safety net — if the fetcher hangs (e.g. supabase env unset and
  // the client keeps retrying) we still resolve to not-found rather than
  // showing skeletons forever.
  const [bailout, setBailout] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setBailout(true), 5000);
    return () => clearTimeout(t);
  }, [loaded]);
  const [booking, setBooking] = useState<Provider | null>(null);
  // Appointments need the real provider id; derive it once provider resolves.
  const apptId = provider?.id;
  const appointments = useAppointments(
    apptId ? { stylistId: apptId } : undefined,
  );
  // All providers for the "similar providers" section.
  const { providers: allProviders } = useProvidersWithStatus();
  const todayISO = getTodayISO();
  // Shared 30-second clock — keeps the "free today" badge honest on a
  // long-open profile page.
  const now = useNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const availableToday = useMemo<boolean>(() => {
    if (!provider) return false;
    const slots = generateSlots(
      provider.workingHours.start,
      provider.workingHours.end,
    );
    const taken = new Set(
      appointments
        .filter(
          (a) =>
            a.stylistId === provider.id &&
            a.date === todayISO &&
            a.status !== "cancelled",
        )
        .map((a) => a.time),
    );
    return slots.some((time) => {
      if (isInBreak(time, provider.breaks)) return false;
      if (taken.has(time)) return false;
      if (isSlotPast(toMinutes(time), nowMinutes, provider.workingHours.start))
        return false;
      return true;
    });
  }, [provider, appointments, todayISO, nowMinutes]);

  const similar = useMemo<Provider[]>(() => {
    if (!provider) return [];
    return allProviders
      .filter((p) => p.id !== provider.id && p.kind === provider.kind)
      .slice(0, 6);
  }, [allProviders, provider]);

  const similarAvail = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of similar) {
      map[p.id] = hasFreeSlotOnDate(p, todayISO, appointments, todayISO, now);
    }
    return map;
  }, [similar, appointments, todayISO, now]);

  // Distinguish "still fetching" from "fetched, definitively absent" so the
  // page doesn't 404 on the first render before Supabase replies. The
  // `bailout` flag forces notFound after a 5s safety timeout.
  if ((loaded || bailout) && !provider) notFound();
  if (!provider) {
    return (
      <main className="mx-auto max-w-7xl px-4 md:px-6 pb-32 lg:pb-24 pt-6">
        <SkeletonProviderPage />
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 md:px-6 pb-32 lg:pb-24 pt-6"
    >
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          {
            label: pickLocalized(KIND_PLURAL[provider.kind]),
            href: `/?kind=${provider.kind}`,
          },
          { label: provider.name },
        ]}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8 min-w-0">
          <ProfileHero provider={provider} availableToday={availableToday} />
          <GalleryGrid provider={provider} />
          <AboutSection provider={provider} />
          <PriceList provider={provider} />
          <Reviews provider={provider} />
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <StickyBooking
            provider={provider}
            onOpenBooking={() => setBooking(provider)}
          />
        </aside>
      </div>

      {similar.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-2xl text-ink-900 tracking-tight">
              Similar providers
            </h2>
          </div>
          {similar.length >= 4 ? (
            <Carousel snap="start" showArrows showDots={false}>
              {similar.map((p) => (
                <div key={p.id} className="w-[320px] sm:w-[360px] md:w-[420px]">
                  <ProviderRow
                    provider={p}
                    onBook={setBooking}
                    availableToday={similarAvail[p.id] ?? false}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {similar.map((p) => (
                <ProviderRow
                  key={p.id}
                  provider={p}
                  onBook={setBooking}
                  availableToday={similarAvail[p.id] ?? false}
                />
              ))}
            </div>
          )}
        </motion.section>
      ) : null}

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </motion.main>
  );
}
