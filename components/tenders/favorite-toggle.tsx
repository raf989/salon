"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  tenderId: string;
  /** Icon-only square button for compact card layouts. */
  iconOnly?: boolean;
  className?: string;
};

// Persisted-localStorage tender bookmark. SSR-safe: server render always
// shows the not-favourited state, the client swaps to the real value after
// hydration so we don't get a mismatch.
export function FavoriteToggle({ tenderId, iconOnly, className }: Props) {
  const { t, lang } = useT();
  const isFav = useStore((s) => s.favoriteTenderIds.includes(tenderId));
  const toggle = useStore((s) => s.toggleFavoriteTender);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const active = hydrated && isFav;

  const ariaLabel = active
    ? lang === "ru"
      ? "Убрать из сохранённых"
      : "Yadda saxlananlardan sil"
    : lang === "ru"
      ? "Сохранить"
      : "Yadda saxla";

  const Icon = active ? BookmarkCheck : Bookmark;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={() => toggle(tenderId)}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={cn(
          "inline-grid place-items-center size-9 rounded-[10px] border border-border-strong bg-surface hover:bg-ink-50 transition-colors",
          active && "text-caspian-600 border-caspian-500/40",
          className,
        )}
      >
        <Icon className="size-4" strokeWidth={1.7} />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => toggle(tenderId)}
      aria-pressed={active}
      className={className}
    >
      <Icon
        className={cn("size-4", active && "text-caspian-600")}
        strokeWidth={1.7}
      />
      {t("tenders.action.save")}
    </Button>
  );
}
