"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn, getGradientForId, getInitials } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<Size, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
  "2xl": "h-32 w-32 text-4xl",
};

type Props = {
  name: string;
  /** Stable id used to pick a gradient deterministically. */
  id: string;
  /** Optional photo URL. When set, shown instead of the initials. */
  imageUrl?: string;
  size?: Size;
  shape?: "circle" | "square";
  className?: string;
  liveDot?: boolean;
};

export function Avatar({
  name,
  id,
  imageUrl,
  size = "md",
  shape = "circle",
  className,
  liveDot,
}: Props) {
  // If `imageUrl` is set but 404s / fails to load, fall back to the
  // initials-on-gradient instead of leaving an empty circle. Reset the
  // failure flag whenever the URL changes so a new (valid) photo retries.
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={cn(
        "relative grid place-items-center font-display font-semibold text-white shadow-[inset_0_-6px_0_rgba(0,0,0,0.10)] flex-none overflow-hidden",
        shape === "circle" ? "rounded-full" : "rounded-2xl",
        SIZE_MAP[size],
        className,
      )}
      style={
        imageUrl && !imgFailed
          ? undefined
          : { background: getGradientForId(id) }
      }
      aria-label={name}
    >
      {imageUrl && !imgFailed ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 96px, 128px"
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="leading-none -mt-0.5 tracking-tight">
          {getInitials(name)}
        </span>
      )}
      {liveDot ? (
        <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success-500 ring-2 ring-surface z-10" />
      ) : null}
    </div>
  );
}
