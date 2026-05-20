"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate as fmAnimate,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type AnimatedCounterProps = {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  suffix?: string;
  className?: string;
};

export function AnimatedCounter({
  to,
  duration = 1.6,
  format,
  suffix,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    const controls = fmAnimate(mv, to, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (!ref.current) return;
      const text = format ? format(v) : String(v);
      ref.current.textContent = suffix ? `${text}${suffix}` : text;
    });
    return unsub;
  }, [rounded, format, suffix]);

  const initialText = format ? format(0) : "0";
  return (
    <motion.span ref={ref} className={cn(className)}>
      {suffix ? `${initialText}${suffix}` : initialText}
    </motion.span>
  );
}
