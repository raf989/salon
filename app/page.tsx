"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { Hero } from "@/components/client/hero";
import { ProviderRow } from "@/components/client/provider-row";
import {
  SearchFilters,
  SortDropdown,
  type SearchFiltersValue,
  type SortKey,
} from "@/components/client/search-filters";
import { BookingModal } from "@/components/client/booking-modal";
import { Card } from "@/components/ui/card";
import { ALL_CITIES_ID, getCityById, getCityIdByName } from "@/lib/cities";
import { useStore } from "@/lib/store";
import {
  useAppointments,
  useProvidersWithStatus,
  useServices,
} from "@/lib/api/repo";
import { SkeletonProviderRow } from "@/components/ui/skeleton";
import { hasFreeSlotOnDate } from "@/lib/availability";
import { useNow } from "@/lib/use-now";
import { getTodayISO } from "@/lib/utils";
import type {
  Localized,
  Provider,
  ProviderKind,
  Service,
} from "@/lib/types";
import { useT } from "@/lib/i18n";

type FiltersValue = { search: string };
const DEFAULT_FILTERS: FiltersValue = { search: "" };

const VALID_KINDS: ReadonlySet<ProviderKind> = new Set<ProviderKind>([
  "photographer",
  "dj",
  "restaurant",
  "host",
  "barber",
  "salon",
  "makeup",
]);

function isProviderKind(v: string | null): v is ProviderKind {
  return v !== null && VALID_KINDS.has(v as ProviderKind);
}

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

  // Branches are ordered alphabetically by their criterion label so the
  // chain is trivially scannable; all are AND-composed, order has no
  // semantic effect.
  return providers.filter((p) => {
    // category — strict equality on ProviderKind.
    if (criteria.kind !== null && p.kind !== criteria.kind) return false;

    // city — "all" is a sentinel meaning "show every city".
    if (criteria.cityId !== "all" && getCityIdByName(p.city) !== criteria.cityId)
      return false;

    // text — matches name, bio or any of the provider's service names.
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

// Next.js requires any component reading `useSearchParams()` to sit inside
// a Suspense boundary, otherwise the static prerender bails. Default export
// is the wrapper; the real body lives in `HomePageInner`.
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const { pickLocalized, lang } = useT();
  const searchParams = useSearchParams();
  // Initialise the kind filter from `?kind=` (e.g. the breadcrumb on the
  // provider page deep-links here). Read-only — typing a new filter doesn't
  // push back to the URL.
  const initialKind = (() => {
    const raw = searchParams?.get("kind") ?? null;
    return isProviderKind(raw) ? raw : null;
  })();
  const [filters, setFilters] = useState<FiltersValue>(DEFAULT_FILTERS);
  const [kindFilter, setKindFilter] = useState<ProviderKind | null>(initialKind);
  const [booking, setBooking] = useState<Provider | null>(null);
  const cityId = useStore((s) => s.cityId);
  const setCityId = useStore((s) => s.setCityId);
  // TODO: this fetches every appointment for every provider just so we can
  // compute today's availability badge per card (n+1-ish — actually 1 query
  // for all rows). AppointmentsQuery currently only accepts
  // { stylistId, clientName }; once a `date` filter is added in
  // lib/api/repo.ts, narrow this to `{ date: todayISO }`.
  // Catalog only needs today's appointments — for the availability badge.
  // Without the filter every client downloads every booking ever, which is
  // both wasteful and a privacy smell.
  const appointments = useAppointments({ date: getTodayISO() });
  const { providers, loaded: providersLoaded } = useProvidersWithStatus();
  const services = useServices();

  // Advanced filter state owned by <SearchFilters />.
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("actuality");

  // District selection is meaningless once the city changes — reset it.
  useEffect(() => {
    setDistrictFilter("all");
  }, [cityId]);

  const resultsRef = useRef<HTMLElement>(null);
  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const todayISO = getTodayISO();

  // ── Derive the district list for the currently picked city.
  //    Strips "City, " prefix so the dropdown shows just "Nəsimi" etc.
  const districtsForCity = useMemo(() => {
    if (cityId === ALL_CITIES_ID) return [];
    const cityObj = getCityById(cityId);
    const cityNames = [cityObj.name.az, cityObj.name.ru];
    const set = new Set<string>();
    for (const p of providers) {
      if (getCityIdByName(p.city) !== cityId) continue;
      if (!p.district) continue;
      const full = pickLocalized(p.district).trim();
      let detail = full;
      for (const c of cityNames) {
        if (full.toLowerCase().startsWith(c.toLowerCase() + ",")) {
          detail = full.slice(c.length + 1).trim();
          break;
        }
      }
      if (detail) set.add(detail);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, lang, { sensitivity: "base" }),
    );
  }, [providers, cityId, pickLocalized, lang]);

  const now = useNow();
  const availabilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of providers) {
      map[p.id] = hasFreeSlotOnDate(p, todayISO, appointments, todayISO, now);
    }
    return map;
  }, [providers, appointments, todayISO, now]);

  const filtered = useMemo(() => {
    // Stage 0 — chain filter: category → city → text.
    const base = applySearchFilters(
      providers,
      { cityId, kind: kindFilter, search: filters.search },
      services,
      pickLocalized,
    );

    const priceMinN = priceMin === "" ? null : Number(priceMin);
    const priceMaxN = priceMax === "" ? null : Number(priceMax);

    // Stage 1 — advanced filters from <SearchFilters />. Branches listed
    // alphabetically by criterion label. All AND-composed.
    const matched = base.filter((p) => {
      // district — match by stripped district detail within the current city.
      if (districtFilter !== "all") {
        if (!p.district) return false;
        const cityObj = getCityById(cityId);
        const full = pickLocalized(p.district).trim();
        let detail = full;
        for (const c of [cityObj.name.az, cityObj.name.ru]) {
          if (full.toLowerCase().startsWith(c.toLowerCase() + ",")) {
            detail = full.slice(c.length + 1).trim();
            break;
          }
        }
        if (detail !== districtFilter) return false;
      }
      // price — provider's cheapest service must fall in [priceMin..priceMax].
      if (priceMinN !== null || priceMaxN !== null) {
        const pMin = minServicePrice(p, services);
        if (!Number.isFinite(pMin)) return false;
        if (priceMinN !== null && pMin < priceMinN) return false;
        if (priceMaxN !== null && pMin > priceMaxN) return false;
      }
      return true;
    });

    // Stage 2 — sort. Branches alphabetical by SortKey value.
    const sorted = [...matched];
    if (sort === "actuality") {
      // "Available today first" then rating desc, then reviewsCount.
      sorted.sort((a, b) => {
        const fa = availabilityMap[a.id] ? 1 : 0;
        const fb = availabilityMap[b.id] ? 1 : 0;
        if (fa !== fb) return fb - fa;
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
    } else if (sort === "expensive") {
      sorted.sort((a, b) => {
        const pa = minServicePrice(a, services);
        const pb = minServicePrice(b, services);
        if (pa !== pb) return pb - pa;
        return b.rating - a.rating;
      });
    } else if (sort === "popular") {
      sorted.sort((a, b) => {
        if (b.reviewsCount !== a.reviewsCount)
          return b.reviewsCount - a.reviewsCount;
        return b.rating - a.rating;
      });
    } else {
      // "rating": rating desc, reviewsCount as tiebreaker.
      sorted.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewsCount - a.reviewsCount;
      });
    }
    return sorted;
  }, [
    providers,
    services,
    filters.search,
    cityId,
    kindFilter,
    districtFilter,
    priceMin,
    priceMax,
    sort,
    pickLocalized,
    availabilityMap,
  ]);

  const isKindActive = kindFilter !== null;

  return (
    <>
      <Hero
        searchValue={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
      />
      <main className="mx-auto max-w-7xl px-3 md:px-6 pt-3 md:pt-4 pb-24 space-y-5 md:space-y-8">
        <SearchFilters
          value={{
            category: kindFilter ?? "all",
            cityId,
            districtId: districtFilter,
            priceMin,
            priceMax,
          }}
          onChange={(next: SearchFiltersValue) => {
            setKindFilter(next.category === "all" ? null : next.category);
            if (next.cityId !== cityId) setCityId(next.cityId);
            setDistrictFilter(next.districtId);
            setPriceMin(next.priceMin);
            setPriceMax(next.priceMax);
          }}
          districts={districtsForCity}
          onShow={scrollToResults}
        />

        <section ref={resultsRef}>
          <div className="mb-3 md:mb-4 flex items-center justify-between gap-2 flex-wrap">
            <SortDropdown value={sort} onChange={setSort} />
            {isKindActive ? (
              <div className="flex items-center gap-2 text-xs md:text-sm text-ink-500 min-w-0">
                <span className="truncate">
                  {pickLocalized({ az: "Filtr", ru: "Фильтр" })}:{" "}
                  {kindFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setKindFilter(null)}
                  className="text-caspian-600 hover:underline font-medium shrink-0"
                >
                  {pickLocalized({ az: "təmizlə", ru: "сбросить" })}
                </button>
              </div>
            ) : null}
          </div>

          <div>
            {!providersLoaded ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonProviderRow key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
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
