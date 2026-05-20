"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
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
      <motion.button
        type="button"
        aria-label={t("card.favorite.aria")}
        aria-pressed={active}
        onClick={handleClick}
        whileTap={{ scale: 0.85 }}
        animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className={cn(
          "grid place-items-center transition-colors",
          active
            ? "text-magenta-500 drop-shadow-[0_0_10px_rgba(255,61,157,0.7)]"
            : "text-ink-400 hover:text-magenta-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
          className,
        )}
      >
        <Heart
          size={20}
          className={active ? "fill-magenta-500" : ""}
          strokeWidth={1.8}
        />
      </motion.button>
      <SignupPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />
    </>
  );
}
