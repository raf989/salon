"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type MarqueeProps = {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
};

export function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Pause when scrolled out of view — the animation keeps composited layers
  // active and burns ~5-10% main thread on long landing pages otherwise.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const xKeyframes =
    direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

  const maskStyle: CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
    maskImage:
      "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
  };

  const paused = (pauseOnHover && hovered) || !visible;

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={maskStyle}
      onMouseEnter={() => pauseOnHover && setHovered(true)}
      onMouseLeave={() => pauseOnHover && setHovered(false)}
    >
      <motion.div
        className="flex w-max"
        animate={paused ? { x: undefined } : { x: xKeyframes }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{ willChange: "transform" }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
