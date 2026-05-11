"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { HeartButton } from "@/components/ui/heart-button";
import { ProviderStatus } from "@/components/client/provider-status";
import { useServices } from "@/lib/api/repo";
import { KIND_LABELS, type Localized, type Provider } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * District labels in our seed data ("Bakı, Nəsimi") already lead with the
 * city. Strip that prefix so we don't render "Bakı · Bakı, Nəsimi" when both
 * fields share their head.
 */
function addressDetail(
  city: Localized,
  district: Localized | undefined,
  pick: (v: Localized) => string,
): string | null {
  if (!district) return null;
  const d = pick(district).trim();
  const c = pick(city).trim();
  if (!d) return null;
  if (d.toLowerCase().startsWith(c.toLowerCase() + ",")) {
    return d.slice(c.length + 1).trim() || null;
  }
  return d;
}

type Props = {
  providers: Provider[];
  /** Optional pagination — render a centered "Daha çox" CTA below the grid. */
  canLoadMore?: boolean;
  onLoadMore?: () => void;
};

export function TodayFreeSection({
  providers,
  canLoadMore = false,
  onLoadMore,
}: Props) {
  const { t, pickLocalized } = useT();
  const allServices = useServices();

  if (providers.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {providers.map((p, i) => {
        const services = allServices.filter((s) => p.serviceIds.includes(s.id));
        const minPrice =
          services.length > 0
            ? Math.min(...services.map((s) => s.price))
            : 0;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: Math.min(i * 0.04, 0.25),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Link
              href={`/provider/${p.id}`}
              className="block h-full"
              aria-label={p.name}
            >
              <Card
                interactive
                className="overflow-hidden p-0 flex flex-col h-full"
              >
                <Cover name={p.name} id={p.id} kind={p.kind} aspect="4/3">
                  <ProviderStatus
                    provider={p}
                    className="absolute top-3 left-3"
                  />
                  <HeartButton className="absolute top-3 right-3" />
                </Cover>
                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink-900 truncate">
                      {p.name}
                    </span>
                    <span className="font-mono font-semibold text-ink-900 whitespace-nowrap">
                      {formatPrice(minPrice)}
                    </span>
                  </div>
                  <span className="text-sm text-ink-500 truncate">
                    {pickLocalized(KIND_LABELS[p.kind])} ·{" "}
                    {pickLocalized(p.city)}
                  </span>
                  {(() => {
                    const detail = addressDetail(p.city, p.district, pickLocalized);
                    return detail ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-400 truncate">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{detail}</span>
                      </span>
                    ) : null;
                  })()}
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
      </div>

      {canLoadMore && onLoadMore ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onLoadMore}
          >
            {t("section.loadMore")}
          </Button>
        </div>
      ) : null}
    </>
  );
}
