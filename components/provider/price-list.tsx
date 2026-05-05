"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { SERVICES } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type Props = {
  provider: Provider;
};

export function PriceList({ provider }: Props) {
  const { t, pickLocalized } = useT();

  const services = useMemo(
    () =>
      SERVICES.filter((s) => provider.serviceIds.includes(s.id)).slice().sort(
        (a, b) => a.price - b.price,
      ),
    [provider],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="font-display font-semibold text-xl text-ink-800 mb-3">
        {t("section.priceList")}
      </h2>
      <Card className="p-4 flex flex-col gap-2">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="flex justify-between items-center gap-4 py-2 border-b border-border last:border-0"
          >
            <span className="text-ink-700 min-w-0">
              {pickLocalized(svc.name)} · {svc.durationMin} {t("provider.minutes")}
            </span>
            <b className="font-mono font-semibold text-ink-900 whitespace-nowrap">
              {formatPrice(svc.price)}
            </b>
          </div>
        ))}
      </Card>
    </motion.section>
  );
}
