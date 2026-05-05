"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PROVIDERS } from "@/lib/mock-data";
import {
  KIND_PLURAL,
  type Localized,
  type ProviderKind,
} from "@/lib/types";
import { useT } from "@/lib/i18n";

type Tone = "event" | "beauty";

type CatDef = {
  id: string;
  kinds: ProviderKind[];
  primaryKind: ProviderKind;
  tone: Tone;
  title: Localized;
  showUrgent: boolean;
};

type Props = {
  onPick: (kind: ProviderKind) => void;
};

const URGENT_LABEL: Localized = { az: "Təcili", ru: "Срочно" };

const CATEGORIES: ReadonlyArray<CatDef> = [
  {
    id: "photographer",
    kinds: ["photographer"],
    primaryKind: "photographer",
    tone: "event",
    title: KIND_PLURAL.photographer,
    showUrgent: false,
  },
  {
    id: "dj-host",
    kinds: ["dj", "host"],
    primaryKind: "dj",
    tone: "event",
    title: KIND_PLURAL.dj,
    showUrgent: false,
  },
  {
    id: "restaurant",
    kinds: ["restaurant"],
    primaryKind: "restaurant",
    tone: "event",
    title: KIND_PLURAL.restaurant,
    showUrgent: false,
  },
  {
    id: "beauty",
    kinds: ["barber", "salon", "makeup"],
    primaryKind: "barber",
    tone: "beauty",
    title: KIND_PLURAL.barber,
    showUrgent: true,
  },
];

const BLOB_STYLE_BY_TONE: Record<Tone, string> = {
  event:
    "radial-gradient(circle, var(--plum-500), transparent 65%)",
  beauty:
    "radial-gradient(circle, var(--rose-500), transparent 65%)",
};

export function CategoriesGrid({ onPick }: Props) {
  const { t, lang, pickLocalized } = useT();

  const counts = useMemo(() => {
    const map: Record<string, { total: number; freeToday: number }> = {};
    for (const cat of CATEGORIES) {
      const matches = PROVIDERS.filter((p) => cat.kinds.includes(p.kind));
      map[cat.id] = {
        total: matches.length,
        // mock-data has no per-day availability — pick a deterministic share
        freeToday: Math.max(1, Math.floor(matches.length / 2)),
      };
    }
    return map;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {CATEGORIES.map((cat, i) => {
        const c = counts[cat.id];
        const totalLine =
          lang === "az"
            ? `${c.total} elan · ${c.freeToday} bu gün boş`
            : `${c.total} объявлений · ${c.freeToday} свободны сегодня`;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(i * 0.05, 0.3),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <button
              type="button"
              onClick={() => onPick(cat.primaryKind)}
              className="block w-full text-left"
              aria-label={pickLocalized(cat.title)}
            >
              <Card
                interactive
                className="relative overflow-hidden p-6 min-h-[200px] flex flex-col justify-between cursor-pointer hover:shadow-[var(--sh-3)] transition-shadow"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-8 -right-8 size-40 rounded-full opacity-20"
                  style={{ background: BLOB_STYLE_BY_TONE[cat.tone] }}
                />
                <div className="relative">
                  <Badge variant={cat.tone === "event" ? "event" : "beauty"}>
                    {t(cat.tone === "event" ? "tier.event" : "tier.beauty")}
                  </Badge>
                  <h3 className="font-display font-semibold text-2xl md:text-[28px] tracking-[-0.01em] text-ink-900 mt-3 leading-[1.1]">
                    {pickLocalized(cat.title)}
                  </h3>
                  <p className="text-sm text-ink-500 mt-2">{totalLine}</p>
                </div>
                {cat.showUrgent ? (
                  <div className="relative mt-4">
                    <Badge variant="urgent" pulse>
                      {pickLocalized(URGENT_LABEL)}
                    </Badge>
                  </div>
                ) : null}
              </Card>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
