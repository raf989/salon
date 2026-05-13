"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { SignupPrompt } from "@/components/auth/signup-prompt";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

type Props = {
  /** Provider id to associate the favourite with. Persisted to localStorage. */
  providerId: string;
  className?: string;
};

// Persisted-localStorage provider bookmark. SSR-safe: server render always
// shows the not-favourited state, the client swaps to the real value after
// hydration so we don't get a mismatch.
//
// Clicking while logged out opens a small SignupPrompt instead of silently
// toggling — favorites are tied to the auth user, so anonymous taps would
// vanish on next device / browser anyway.
export function HeartButton({ providerId, className }: Props) {
  const { t } = useT();
  const isFav = useStore((s) => s.favoriteProviderIds.includes(providerId));
  const toggle = useStore((s) => s.toggleFavoriteProvider);
  const sessionUserId = useStore((s) => s.sessionUserId);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const active = hydrated && isFav;
  const loggedIn = hydrated && !!sessionUserId;

  const [promptOpen, setPromptOpen] = useState(false);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!loggedIn) {
      setPromptOpen(true);
      return;
    }
    toggle(providerId);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("card.favorite.aria")}
        aria-pressed={active}
        onClick={handleClick}
        className={cn(
          "grid place-items-center text-white/95 hover:text-pomegranate-500 transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
          active && "text-pomegranate-500",
          className,
        )}
      >
        <Heart
          size={20}
          className={active ? "fill-pomegranate-500" : ""}
          strokeWidth={1.8}
        />
      </button>
      <SignupPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />
    </>
  );
}
