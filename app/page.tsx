"use client";

import { useCallback, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Hero, type QuickFilterKind } from "@/components/client/hero";
import { CategoriesGrid } from "@/components/client/categories-grid";
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
import type { Provider, ProviderKind, ProviderTier, Service } from "@/lib/types";
import { useT, type DictKey } from "@/lib/i18n";

const SLOT_MIN = 30;
const FREE_TODAY_LIMIT = 4;

type SortKey = "trust" | "cheap" | "freeToday";
type TierFilter = "all" | ProviderTier;

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; labelKey: DictKey }> = [
  { key: "trust", labelKey: "results.sort.recommended" },
  { key: "cheap", labelKey: "results.sort.cheapest" },
  { key: "freeToday", labelKey: "filters.option.today" },
];

type QuickFilterPreset = {
  kind?: ProviderKind | null;
  availability?: FiltersValue["availability"];
  category?: FiltersValue["category"];
};

const QUICK_FILTER_PRESETS: Record<QuickFilterKind, QuickFilterPreset> = {
  urgentToday: { availability: "today" },
  weddingTurnkey: { kind: "photographer" },
  barberHome: { kind: "barber" },
  corporate: { kind: "dj" },
  kidsParty: { kind: "host" },
};

function minServicePrice(p: Provider, services: Service[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const s of services) {
    if (p.serviceIds.includes(s.id) && s.price < min) min = s.price;
  }
  return Number.isFinite(min) ? min : Number.POSITIVE_INFINITY;
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
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterKind | null>(null);
  const [booking, setBooking] = useState<Provider | null>(null);
  const [sort, setSort] = useState<SortKey>("trust");
  const cityId = useStore((s) => s.cityId);
  const appointments = useAppointments();
  const providers = useProviders();
  const services = useServices();

  const todayISO = getTodayISO();
  const cityName = pickLocalized(getCityById(cityId).name);

  const inSelectedCity = useCallback(
    (p: Provider): boolean => getCityIdByName(p.city) === cityId,
    [cityId],
  );

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

  const freeTodayProviders = useMemo(() => {
    const matches = providers
      .filter((p) => inSelectedCity(p) && availabilityMap[p.id])
      .filter((p) => {
        if (tierFilter === "all") return true;
        return p.tier === tierFilter;
      });
    return matches.slice(0, FREE_TODAY_LIMIT);
  }, [providers, availabilityMap, tierFilter, inSelectedCity]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const matchesSearch = (p: Provider): boolean => {
      if (!search) return true;
      if (p.name.toLowerCase().includes(search)) return true;
      if (pickLocalized(p.bio).toLowerCase().includes(search)) return true;
      const providerServices = services.filter((s) =>
        p.serviceIds.includes(s.id),
      );
      return providerServices.some((s) =>
        pickLocalized(s.name).toLowerCase().includes(search),
      );
    };

    const hasFreeSlotInWeek = (p: Provider): boolean => {
      for (let i = 0; i < 7; i++) {
        if (hasFreeSlotOnDate(p, getDateISO(i))) return true;
      }
      return false;
    };

    const matched = providers.filter((p) => {
      if (!inSelectedCity(p)) return false;
      if (!matchesSearch(p)) return false;
      if (kindFilter !== null && p.kind !== kindFilter) return false;
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
    kindFilter,
    hasFreeSlotOnDate,
    todayISO,
    pickLocalized,
    inSelectedCity,
    sort,
    availabilityMap,
  ]);

  const applyQuickFilter = (kind: QuickFilterKind) => {
    if (activeQuickFilter === kind) {
      setActiveQuickFilter(null);
      setKindFilter(null);
      setFilters(DEFAULT_FILTERS);
      return;
    }
    const preset = QUICK_FILTER_PRESETS[kind];
    setActiveQuickFilter(kind);
    setKindFilter(preset.kind ?? null);
    setFilters({
      ...DEFAULT_FILTERS,
      availability: preset.availability ?? DEFAULT_FILTERS.availability,
      category: preset.category ?? DEFAULT_FILTERS.category,
    });
  };

  const isKindActive = kindFilter !== null;

  return (
    <>
      <Hero
        searchValue={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        onQuickFilter={applyQuickFilter}
        activeQuickFilter={activeQuickFilter}
      />
      <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24 space-y-12">
        <section>
          <SectionHeader
            title={t("section.categories")}
            href="#"
            linkLabel={t("section.allLink")}
          />
          <CategoriesGrid onPick={(kind) => setKindFilter(kind)} />
        </section>

        <section>
          <SectionHeader
            title={t("section.freeToday")}
            right={
              <div className="flex gap-2">
                <TabChip
                  active={tierFilter === "all"}
                  onClick={() => setTierFilter("all")}
                >
                  {t("filters.option.all")}
                </TabChip>
                <TabChip
                  active={tierFilter === "event"}
                  onClick={() => setTierFilter("event")}
                >
                  {t("tier.event")}
                </TabChip>
                <TabChip
                  active={tierFilter === "beauty"}
                  onClick={() => setTierFilter("beauty")}
                >
                  {t("tier.beauty")}
                </TabChip>
              </div>
            }
          />
          <TodayFreeSection providers={freeTodayProviders} />
        </section>

        <section>
          {isKindActive ? (
            <div className="mb-3 flex items-center gap-2 text-sm text-ink-500">
              <span>
                {pickLocalized({ az: "Filtr", ru: "Фильтр" })}: {kindFilter}
              </span>
              <button
                type="button"
                onClick={() => {
                  setKindFilter(null);
                  setActiveQuickFilter(null);
                }}
                className="text-caspian-600 hover:underline font-medium"
              >
                {pickLocalized({ az: "təmizlə", ru: "сбросить" })}
              </button>
            </div>
          ) : null}
          <Filters value={filters} onChange={setFilters} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-ink-500">
              {lang === "ru" ? `В ${cityName}` : `${cityName} şəhərində`}{" "}
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

function TabChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 px-3 rounded-full text-sm font-medium border border-transparent transition-colors",
        active
          ? "bg-ink-900 text-ink-0"
          : "bg-ink-50 text-ink-700 hover:bg-ink-100",
      )}
    >
      {children}
    </button>
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
