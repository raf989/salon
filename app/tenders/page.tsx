"use client";

import { useMemo, useState } from "react";
import { useTenders } from "@/lib/api/repo";
import { useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Crumbs } from "@/components/ui/crumbs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionHeader } from "@/components/ui/section-header";
import { TenderCard } from "@/components/tenders/tender-card";
import { TenderCardCompact } from "@/components/tenders/tender-card-compact";
import { BidsPanel } from "@/components/tenders/bids-panel";
import { CreateTenderCta } from "@/components/tenders/create-tender-cta";

type FilterKey = "all" | "event" | "beauty" | "mine";

const FILTER_KEYS: ReadonlyArray<FilterKey> = [
  "all",
  "event",
  "beauty",
  "mine",
];

const MINE_AUTHOR = "Aytən S.";

export default function TendersPage() {
  const { t } = useT();
  const [filter, setFilter] = useState<FilterKey>("all");
  const tenders = useTenders();

  const filtered = useMemo(() => {
    if (filter === "all") return tenders;
    if (filter === "mine") {
      return tenders.filter((tender) => tender.authorName === MINE_AUTHOR);
    }
    return tenders.filter((tender) => tender.tier === filter);
  }, [filter, tenders]);

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
        <h1 className="font-display font-semibold text-4xl md:text-5xl text-ink-900 leading-[1.05] tracking-[-0.02em] mb-3">
          {t("tenders.title")}
        </h1>
        <p className="text-base md:text-lg text-ink-500 leading-relaxed">
          {t("tenders.subtitle")}
        </p>
      </header>

      <CreateTenderCta />

      <div className="flex flex-wrap items-center gap-2 mt-8 mb-6">
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
                "h-9 px-4 rounded-full text-sm font-medium transition-colors",
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

      {filtered.length === 0 ? (
        <p className="text-ink-500 py-12 text-center">{t("tenders.empty")}</p>
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
    </main>
  );
}
