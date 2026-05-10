"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { BookingModal } from "@/components/client/booking-modal";
import { Crumbs } from "@/components/ui/crumbs";
import { AboutSection } from "@/components/provider/about-section";
import { DemandAnalytics } from "@/components/provider/demand-analytics";
import { GalleryGrid } from "@/components/provider/gallery-grid";
import { PriceList } from "@/components/provider/price-list";
import { ProfileHero } from "@/components/provider/profile-hero";
import { Reviews } from "@/components/provider/reviews";
import { StickyBooking } from "@/components/provider/sticky-booking";
import { useT } from "@/lib/i18n";
import { useAppointments, useProvider, useProviders } from "@/lib/api/repo";
import { KIND_PLURAL, type Provider } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";

const SLOT_MIN = 30;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  for (let t = startMin; t + SLOT_MIN <= endMin; t += SLOT_MIN) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

function isInBreak(
  time: string,
  breaks: { start: string; end: string }[],
): boolean {
  const t = toMinutes(time);
  return breaks.some((b) => t >= toMinutes(b.start) && t < toMinutes(b.end));
}

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
  const allProviders = useProviders();
  const provider = useProvider(id);
  const [booking, setBooking] = useState<Provider | null>(null);
  const appointments = useAppointments({ stylistId: id });
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
      if (toMinutes(time) <= nowMinutes) return false;
      return true;
    });
  }, [provider, appointments, todayISO]);

  const exists = allProviders.some((p) => p.id === id);
  if (!exists) notFound();
  if (!provider) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6">
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
          <DemandAnalytics provider={provider} />
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
