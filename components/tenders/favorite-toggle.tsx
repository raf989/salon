"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { SignupPrompt } from "@/components/auth/signup-prompt";
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
//
// Anonymous taps open the SignupPrompt — same UX as HeartButton.
export function FavoriteToggle({ tenderId, iconOnly, className }: Props) {
  const { t, lang } = useT();
  const isFav = useStore((s) => s.favoriteTenderIds.includes(tenderId));
  const toggle = useStore((s) => s.toggleFavoriteTender);
  const sessionUserId = useStore((s) => s.sessionUserId);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const active = hydrated && isFav;
  const loggedIn = hydrated && !!sessionUserId;

  const [promptOpen, setPromptOpen] = useState(false);

  const handleClick = () => {
    if (!loggedIn) {
      setPromptOpen(true);
      return;
    }
    toggle(tenderId);
  };

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
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={active}
          aria-label={ariaLabel}
          className={cn(
            "inline-grid place-items-center size-11 sm:size-9 rounded-[10px] border border-border-strong bg-surface hover:bg-ink-50 transition-colors shrink-0",
            active && "text-caspian-600 border-caspian-500/40",
            className,
          )}
        >
          <Icon className="size-4" strokeWidth={1.7} />
        </button>
        <SignupPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        aria-pressed={active}
        className={className}
      >
        <Icon
          className={cn("size-4", active && "text-caspian-600")}
          strokeWidth={1.7}
        />
        {t("tenders.action.save")}
      </Button>
      <SignupPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />
    </>
  );
}
