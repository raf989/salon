"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Cover } from "@/components/ui/cover";
import { HeartButton } from "@/components/ui/heart-button";
import { useServices } from "@/lib/api/repo";
import { KIND_LABELS, type Provider } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Props = {
  providers: Provider[];
};

export function TodayFreeSection({ providers }: Props) {
  const { t, pickLocalized } = useT();
  const allServices = useServices();

  if (providers.length === 0) return null;

  return (
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
                  <Badge
                    variant="success-soft"
                    pulse
                    className="absolute top-3 left-3"
                  >
                    {t("provider.freeToday")}
                  </Badge>
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
                    {pickLocalized(KIND_LABELS[p.kind])}
                  </span>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
