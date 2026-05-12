"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { ALL_CITIES_ID, CITIES, getCityById } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { SelectMenu } from "./select-menu";

export function CitySelector({
  className,
  variant = "pill",
  align = "right",
}: {
  className?: string;
  variant?: "pill" | "inline";
  align?: "left" | "right";
}) {
  const cityId = useStore((s) => s.cityId);
  const setCityId = useStore((s) => s.setCityId);
  const { lang, pickLocalized } = useT();

  const current = getCityById(cityId);

  // City list is sorted alphabetically by the current language so the
  // collation matches what the user sees (AZ Latin vs RU Cyrillic differ).
  // The "Hamısı / Все" row stays pinned to the top of the menu.
  const options = useMemo(() => {
    const cityOptions = CITIES.map((c) => ({
      value: c.id,
      label: pickLocalized(c.name),
    })).sort((a, b) =>
      a.label.localeCompare(b.label, lang, { sensitivity: "base" }),
    );
    return [
      {
        value: ALL_CITIES_ID,
        label: lang === "ru" ? "Все" : "Hamısı",
      },
      ...cityOptions,
    ];
  }, [lang, pickLocalized]);

  return (
    <SelectMenu
      className={className}
      value={cityId}
      onChange={(v) => {
        if (v) setCityId(v);
      }}
      options={options}
      triggerVariant={variant}
      triggerIcon={<MapPin className="size-4 text-ink-400" />}
      triggerPlaceholder={pickLocalized(current.name)}
      searchPlaceholder={lang === "ru" ? "Поиск города…" : "Şəhəri axtar…"}
      emptyLabel={lang === "ru" ? "Ничего не найдено" : "Heç nə tapılmadı"}
      align={align}
    />
  );
}
