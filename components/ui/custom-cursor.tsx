"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], input, textarea, select, [data-magnetic]';

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 200, damping: 25, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 200, damping: 25, mass: 0.5 });

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;
    setEnabled(true);

    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    const flush = () => {
      if (pending.current) {
        x.set(pending.current.x);
        y.set(pending.current.y);
        pending.current = null;
      }
      rafRef.current = null;
    };

    const onMove = (e: MouseEvent) => {
      pending.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest && t.closest(INTERACTIVE_SELECTOR)) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = prevCursor;
    };
  }, [x, y]);

  if (!mounted || !enabled) return null;

  return (
    <>
      {/* Outer ring — lags + morphs */}
      <motion.div
        aria-hidden
        style={{
          translateX: ringX,
          translateY: ringY,
        }}
        className="pointer-events-none fixed left-0 top-0 z-50"
      >
        <motion.div
          animate={
            hovering
              ? {
                  width: 48,
                  height: 48,
                  marginLeft: -24,
                  marginTop: -24,
                  borderWidth: 1,
                }
              : {
                  width: 16,
                  height: 16,
                  marginLeft: -8,
                  marginTop: -8,
                  borderWidth: 0,
                }
          }
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={
            hovering
              ? "rounded-full border-violet-500/60 bg-violet-500/20 backdrop-blur-sm mix-blend-normal"
              : "rounded-full bg-gradient-to-br from-violet-500 to-magenta-500 mix-blend-difference"
          }
        />
      </motion.div>

      {/* Inner dot — no lag, hidden on hover */}
      <motion.div
        aria-hidden
        style={{ translateX: x, translateY: y }}
        className="pointer-events-none fixed left-0 top-0 z-50"
      >
        <motion.div
          animate={{ opacity: hovering ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className="h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        />
      </motion.div>
    </>
  );
}
