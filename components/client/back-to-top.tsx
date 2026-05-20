"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

/**
 * Floating "back to top" pill that appears after scrolling past the hero.
 * Click smooth-scrolls to top. Aurora gradient ring + violet glow on hover.
 */
export function BackToTop() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setShow(v > 600);
  });

  return (
    <motion.button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        scale: show ? 1 : 0.7,
        y: show ? 0 : 16,
        pointerEvents: show ? "auto" : "none",
      }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="fixed bottom-6 right-6 z-40 size-12 rounded-full glass-strong border border-border-strong shadow-[var(--sh-glow-violet)] grid place-items-center text-ink-900 hover:text-violet-300 transition-colors"
    >
      <ArrowUp className="size-5" strokeWidth={1.8} />
    </motion.button>
  );
}
