"use client";

import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Props = {
  className?: string;
  defaultActive?: boolean;
  onChange?: (active: boolean) => void;
};

export function HeartButton({
  className,
  defaultActive = false,
  onChange,
}: Props) {
  const [active, setActive] = useState<boolean>(defaultActive);
  const { t } = useT();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setActive((a) => {
      const n = !a;
      onChange?.(n);
      return n;
    });
  };

  return (
    <button
      type="button"
      aria-label={t("card.favorite.aria")}
      aria-pressed={active}
      onClick={handleClick}
      className={cn(
        "h-9 w-9 rounded-full bg-surface/95 grid place-items-center text-ink-700 shadow-[var(--sh-1)] hover:text-pomegranate-500 transition-colors",
        active && "text-pomegranate-500",
        className,
      )}
    >
      <Heart
        size={16}
        className={active ? "fill-pomegranate-500" : ""}
        strokeWidth={1.7}
      />
    </button>
  );
}
