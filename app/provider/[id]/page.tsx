"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { BookingModal } from "@/components/client/booking-modal";
import { Crumbs } from "@/components/ui/crumbs";
import { AboutSection } from "@/components/provider/about-section";
import { GalleryGrid } from "@/components/provider/gallery-grid";
import { PriceList } from "@/components/provider/price-list";
import { ProfileHero } from "@/components/provider/profile-hero";
import { Reviews } from "@/components/provider/reviews";
import { StickyBooking } from "@/components/provider/sticky-booking";
import { SkeletonProviderPage } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { useAppointments, useProviderBySlugWithStatus } from "@/lib/api/repo";
import { generateSlots, isInBreak, isSlotPast, toMinutes } from "@/lib/slots";
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
  const [booking, setBooking] = useState<Provider | null>(null);
  // Appointments need the real provider id; derive it once provider resolves.
  const apptId = provider?.id;
  const appointments = useAppointments(
    apptId ? { stylistId: apptId } : undefined,
  );
  const todayISO = getTodayISO();

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
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.some((time) => {
      if (isInBreak(time, provider.breaks)) return false;
      if (taken.has(time)) return false;
      if (isSlotPast(toMinutes(time), nowMinutes, provider.workingHours.start))
        return false;
      return true;
    });
  }, [provider, appointments, todayISO]);

  // Distinguish "still fetching" from "fetched, definitively absent" so the
  // page doesn't 404 on the first render before Supabase replies.
  if (loaded && !provider) notFound();
  if (!provider) {
    return (
      <main className="mx-auto max-w-7xl px-4 md:px-6 pb-32 lg:pb-24 pt-6">
        <SkeletonProviderPage />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 pb-32 lg:pb-24 pt-6">
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

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </main>
  );
}
