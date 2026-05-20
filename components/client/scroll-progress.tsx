"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A thin aurora-gradient progress bar fixed to the top of the viewport that
 * tracks scrollYProgress. Spring-smoothed so it feels alive instead of jumpy.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.3,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-gradient-to-r from-magenta-500 via-violet-500 to-cyan-500 shadow-[0_0_12px_rgba(155,108,246,0.6)]"
    />
  );
}
