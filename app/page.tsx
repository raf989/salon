"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Hero } from "@/components/client/hero";
import { TodayFreeSection } from "@/components/client/today-free-section";
import { ProviderRow } from "@/components/client/provider-row";
import {
  Filters,
  DEFAULT_FILTERS,
  type Filters as FiltersValue,
} from "@/components/client/filters";
import { BookingModal } from "@/components/client/booking-modal";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { getCityIdByName, getCityById } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { useAppointments, useProviders, useServices } from "@/lib/api/repo";
import { cn, getDateISO, getTodayISO } from "@/lib/utils";
import type {
  Localized,
  Provider,
  ProviderKind,
  Service,
} from "@/lib/types";
import { useT, type DictKey } from "@/lib/i18n";

const SLOT_MIN = 30;
const FEATURED_PAGE_SIZE = 4;

type SortKey = "trust" | "cheap" | "freeToday";

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; labelKey: DictKey }> = [
  { key: "trust", labelKey: "results.sort.recommended" },
  { key: "cheap", labelKey: "results.sort.cheapest" },
  { key: "freeToday", labelKey: "filters.option.today" },
];

function minServicePrice(p: Provider, services: Service[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const s of services) {
    if (p.serviceIds.includes(s.id) && s.price < min) min = s.price;
  }
  return Number.isFinite(min) ? min : Number.POSITIVE_INFINITY;
}

/**
 * Chain filtering: category → city → text. Pure; safe to call anywhere.
 * All three are AND-composed; missing criteria are treated as "match all".
 */
export type SearchCriteria = {
  cityId: string;
  kind: ProviderKind | null;
  search: string;
};

function applySearchFilters(
  providers: Provider[],
  criteria: SearchCriteria,
  services: Service[],
  pickLocalized: (v: Localized) => string,
): Provider[] {
  const q = criteria.search.trim().toLowerCase();

  return providers.filter((p) => {
    // 1. Category (strict equality on ProviderKind).
    if (criteria.kind !== null && p.kind !== criteria.kind) return false;

    // 2. City — "all" is a sentinel meaning "show every city".
    if (criteria.cityId !== "all" && getCityIdByName(p.city) !== criteria.cityId)
      return false;

    // 3. Text — over name + bio + service names of the surviving provider.
    if (q) {
      const inName = p.name.toLowerCase().includes(q);
      const inBio = pickLocalized(p.bio).toLowerCase().includes(q);
      const inService = services
        .filter((s) => p.serviceIds.includes(s.id))
        .some((s) => pickLocalized(s.name).toLowerCase().includes(q));
      if (!inName && !inBio && !inService) return false;
    }

    return true;
  });
}

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

export default function HomePage() {
  const { t, pickLocalized, lang } = useT();
  const [filters, setFilters] = useState<FiltersValue>(DEFAULT_FILTERS);
  const [kindFilter, setKindFilter] = useState<ProviderKind | null>(null);
  const [booking, setBooking] = useState<Provider | null>(null);
  const [sort, setSort] = useState<SortKey>("trust");
  const cityId = useStore((s) => s.cityId);
  const appointments = useAppointments();
  const providers = useProviders();
  const services = useServices();

  const todayISO = getTodayISO();
  const cityIsAll = cityId === "all";
  const cityName = cityIsAll
    ? lang === "ru"
      ? "Все города"
      : "Bütün şəhərlər"
    : pickLocalized(getCityById(cityId).name);

  const hasFreeSlotOnDate = useCallback(
    (p: Provider, date: string): boolean => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const slots = generateSlots(p.workingHours.start, p.workingHours.end);
      const isToday = date === todayISO;
      const taken = new Set(
        appointments
          .filter(
            (a) =>
              a.stylistId === p.id &&
              a.date === date &&
              a.status !== "cancelled",
          )
          .map((a) => a.time),
      );
      return slots.some((time) => {
        if (isInBreak(time, p.breaks)) return false;
        if (taken.has(time)) return false;
        if (isToday && toMinutes(time) <= nowMinutes) return false;
        return true;
      });
    },
    [appointments, todayISO],
  );

  const availabilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of providers) {
      map[p.id] = hasFreeSlotOnDate(p, todayISO);
    }
    return map;
  }, [providers, hasFreeSlotOnDate, todayISO]);

  // Full list of providers eligible for the "Önə çıxanlar" section.
  // The counter shows this length; the rendered slice is governed by
  // `featuredVisibleCount` below.
  const featuredAll = useMemo(() => {
    const base = applySearchFilters(
      providers,
      { cityId, kind: kindFilter, search: filters.search },
      services,
      pickLocalized,
    );
    return base.filter((p) => availabilityMap[p.id]);
  }, [
    providers,
    services,
    cityId,
    kindFilter,
    filters.search,
    pickLocalized,
    availabilityMap,
  ]);

  const [featuredVisibleCount, setFeaturedVisibleCount] = useState(
    FEATURED_PAGE_SIZE,
  );

  // Whenever the user changes a filter, reset pagination so the next list
  // starts from the first FEATURED_PAGE_SIZE items.
  useEffect(() => {
    setFeaturedVisibleCount(FEATURED_PAGE_SIZE);
  }, [cityId, kindFilter, filters.search]);

  const featuredVisible = useMemo(
    () => featuredAll.slice(0, featuredVisibleCount),
    [featuredAll, featuredVisibleCount],
  );
  const canLoadMoreFeatured = featuredVisibleCount < featuredAll.length;

  const filtered = useMemo(() => {
    const hasFreeSlotInWeek = (p: Provider): boolean => {
      for (let i = 0; i < 7; i++) {
        if (hasFreeSlotOnDate(p, getDateISO(i))) return true;
      }
      return false;
    };

    // Stage 0 — chain filter: category → city → text.
    const base = applySearchFilters(
      providers,
      { cityId, kind: kindFilter, search: filters.search },
      services,
      pickLocalized,
    );

    // Stage 1 — secondary filters from the <Filters /> card.
    const matched = base.filter((p) => {
      if (
        filters.category !== "all" &&
        !p.specialties.includes(filters.category)
      )
        return false;
      if (filters.price !== "all" && p.priceRange !== filters.price)
        return false;
      if (filters.minRating === 4 && p.rating < 4) return false;
      if (
        filters.availability === "today" &&
        !hasFreeSlotOnDate(p, todayISO)
      )
        return false;
      if (filters.availability === "week" && !hasFreeSlotInWeek(p))
        return false;
      return true;
    });

    const sorted = [...matched];
    if (sort === "trust") {
      sorted.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewsCount - a.reviewsCount;
      });
    } else if (sort === "cheap") {
      sorted.sort((a, b) => {
        const pa = minServicePrice(a, services);
        const pb = minServicePrice(b, services);
        if (pa !== pb) return pa - pb;
        return b.rating - a.rating;
      });
    } else if (sort === "freeToday") {
      sorted.sort((a, b) => {
        const fa = availabilityMap[a.id] ? 1 : 0;
        const fb = availabilityMap[b.id] ? 1 : 0;
        if (fa !== fb) return fb - fa;
        return b.rating - a.rating;
      });
    }
    return sorted;
  }, [
    providers,
    services,
    filters,
    cityId,
    kindFilter,
    hasFreeSlotOnDate,
    todayISO,
    pickLocalized,
    sort,
    availabilityMap,
  ]);

  const isKindActive = kindFilter !== null;

  return (
    <>
      <Hero
        searchValue={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        kindFilter={kindFilter}
        onKindChange={setKindFilter}
      />
      <main className="mx-auto max-w-7xl px-4 md:px-6 pt-10 md:pt-16 pb-24 space-y-12">
        <section>
          <SectionHeader
            title={`${t("section.freeToday")} (${featuredAll.length})`}
          />
          <TodayFreeSection
            providers={featuredVisible}
            canLoadMore={canLoadMoreFeatured}
            onLoadMore={() =>
              setFeaturedVisibleCount((c) => c + FEATURED_PAGE_SIZE)
            }
          />
        </section>

        <section>
          {isKindActive ? (
            <div className="mb-3 flex items-center gap-2 text-sm text-ink-500">
              <span>
                {pickLocalized({ az: "Filtr", ru: "Фильтр" })}: {kindFilter}
              </span>
              <button
                type="button"
                onClick={() => setKindFilter(null)}
                className="text-caspian-600 hover:underline font-medium"
              >
                {pickLocalized({ az: "təmizlə", ru: "сбросить" })}
              </button>
            </div>
          ) : null}
          <Filters value={filters} onChange={setFilters} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-ink-500">
              {cityIsAll
                ? cityName
                : lang === "ru"
                  ? `В ${cityName}`
                  : `${cityName} şəhərində`}{" "}
              {filtered.length} {t("results.foundCount")}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const active = sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSort(opt.key)}
                    aria-pressed={active}
                    className={cn(
                      "h-7 px-2.5 rounded-full text-xs font-medium border border-transparent transition-colors",
                      active
                        ? "bg-ink-900 text-ink-0"
                        : "bg-ink-50 text-ink-700 hover:bg-ink-100",
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <ProviderRow
                    key={p.id}
                    provider={p}
                    onBook={setBooking}
                    availableToday={availabilityMap[p.id] ?? false}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <BookingModal
        stylist={booking}
        open={booking !== null}
        onClose={() => setBooking(null)}
      />
    </>
  );
}


function EmptyState() {
  const { t } = useT();
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-20 text-center border-dashed">
      <span className="size-12 rounded-full bg-ink-50 grid place-items-center text-ink-500">
        <SearchX className="size-5" />
      </span>
      <p className="text-ink-500 max-w-xs">{t("results.empty")}</p>
    </Card>
  );
}
