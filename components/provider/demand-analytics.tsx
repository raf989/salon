"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  provider: Provider;
};

export function DemandAnalytics({ provider }: Props) {
  const { t, lang } = useT();
  const minutesLabel = lang === "ru" ? "мин" : "dəq";
  const responseValue = `${provider.responseMins ?? 5} ${minutesLabel}`;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <b className="text-ink-900">{t("section.discoverDemand")}</b>
      <Row label={t("provider.savedToFavs")} value="241" />
      <Row
        label={t("provider.topQueries")}
        valueRich={
          <b className="text-ink-900">
            {lang === "ru" ? "«свадьба», «лав-стори»" : "«toy», «lavstory»"}
          </b>
        }
      />
      <Row
        label={t("provider.responseSpeed")}
        value={responseValue}
        valueClass="text-success-500"
      />
    </Card>
  );
}

function Row({
  label,
  value,
  valueRich,
  valueClass,
}: {
  label: string;
  value?: string;
  valueRich?: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      {valueRich ?? (
        <b className={cn("font-mono text-ink-900", valueClass)}>{value}</b>
      )}
    </div>
  );
}
