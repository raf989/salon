"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSearch, Plus } from "lucide-react";
import { useTendersRealtime, useTendersWithStatus } from "@/lib/api/repo";
import {
  SkeletonTenderCard,
  SkeletonTenderCardCompact,
} from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Crumbs } from "@/components/ui/crumbs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionHeader } from "@/components/ui/section-header";
import { TenderCard } from "@/components/tenders/tender-card";
import { TenderCardCompact } from "@/components/tenders/tender-card-compact";
import { BidsPanel } from "@/components/tenders/bids-panel";
import { CreateTenderModal } from "@/components/tenders/create-tender-modal";

type FilterKey = "all" | "event" | "mine";

const FILTER_KEYS: ReadonlyArray<FilterKey> = ["all", "event", "mine"];

export default function TendersPage() {
  // Live-refresh when new tenders / bids land — same UX as a Twitter feed.
  useTendersRealtime();
  const { t } = useT();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const { tenders, loaded: tendersLoaded } = useTendersWithStatus();

  // Resolve the current user's display name from the persisted store. Used
  // to scope the "Мои" filter. Same hydration guard as <Header /> — the
  // persisted auth state isn't available during SSR, so we read null until
  // the client has mounted to avoid SSR/CSR mismatch.
  const currentUserName = useCurrentUser()?.name ?? null;
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const mineAuthor = hydrated ? currentUserName : null;

  const filtered = useMemo(() => {
    if (filter === "all") return tenders;
    if (filter === "mine") {
      if (!mineAuthor) return [];
      return tenders.filter((tender) => tender.authorName === mineAuthor);
    }
    return tenders.filter((tender) => tender.tier === filter);
  }, [filter, tenders, mineAuthor]);

  const [featured, ...rest] = filtered;

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24 pt-6">
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
                  <TenderCardCompact key={tender.id} tender={tender} />
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
    </main>
  );
}
