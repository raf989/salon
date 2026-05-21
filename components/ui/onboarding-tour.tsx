"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { lockBodyScroll } from "@/lib/scroll-lock";

export type Step = {
  selector: string;
  title: string;
  body: string;
  action?: "click" | "type" | "hover";
  cursorOffset?: { x: number; y: number };
};

export type OnboardingTourProps = {
  steps: Step[];
  open: boolean;
  onClose: () => void;
  autoAdvanceMs?: number;
};

type TargetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PAD = 8;
const CURSOR_SIZE = 40;

export function OnboardingTour({
  steps,
  open,
  onClose,
  autoAdvanceMs = 3000,
}: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const step = steps[stepIndex];

  // Find the target and measure it. Skip the step if not found.
  useEffect(() => {
    if (!open || !step) return;
    let cancelled = false;
    const measure = () => {
      const el = document.querySelector(step.selector);
      if (!el) {
        if (!cancelled) {
          // Skip missing step by advancing.
          if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
          else onClose();
        }
        return;
      }
      const r = el.getBoundingClientRect();
      if (!cancelled) {
        setRect({
          x: r.left,
          y: r.top,
          width: r.width,
          height: r.height,
        });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, stepIndex, steps.length, onClose]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [stepIndex, steps.length, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  // Auto-advance: simulate "click" near end of each step.
  useEffect(() => {
    if (!open || !step || !rect) return;
    setClicking(false);
    const clickTimer = window.setTimeout(() => setClicking(true), 1000);
    const advanceTimer = window.setTimeout(next, autoAdvanceMs);
    return () => {
      window.clearTimeout(clickTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [open, step, rect, autoAdvanceMs, next]);

  // Lock body scroll while open (ref-counted — see lib/scroll-lock).
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (!mounted || !open || !step) return null;

  // Compute cursor target — center of element + offset.
  const cursorTarget = rect
    ? {
        x:
          rect.x +
          rect.width / 2 -
          CURSOR_SIZE / 2 +
          (step.cursorOffset?.x ?? 0),
        y:
          rect.y +
          rect.height / 2 -
          CURSOR_SIZE / 2 +
          (step.cursorOffset?.y ?? 0),
      }
    : { x: 0, y: 0 };

  // Tooltip placement: prefer below target unless it would go off-screen.
  const tooltipMaxW = 320;
  let tooltipX = rect ? rect.x : 0;
  let tooltipY = rect ? rect.y + rect.height + SPOTLIGHT_PAD + 12 : 0;
  if (typeof window !== "undefined") {
    if (tooltipX + tooltipMaxW > window.innerWidth - 16) {
      tooltipX = Math.max(16, window.innerWidth - tooltipMaxW - 16);
    }
    if (rect && tooltipY + 180 > window.innerHeight) {
      tooltipY = Math.max(16, rect.y - 180 - SPOTLIGHT_PAD);
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200] pointer-events-auto"
      >
        {/* Spotlight: a div positioned over the target with a giant box-shadow
            acting as the dark overlay covering everything else. */}
        {rect ? (
          <motion.div
            initial={false}
            animate={{
              x: rect.x - SPOTLIGHT_PAD,
              y: rect.y - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 left-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        )}

        {/* Simulated cursor */}
        {rect ? (
          <motion.div
            initial={false}
            animate={{
              x: cursorTarget.x,
              y: cursorTarget.y,
              scale: clicking ? 0.85 : 1,
            }}
            transition={{
              x: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 0.15 },
            }}
            className="absolute top-0 left-0 pointer-events-none z-10"
            style={{ width: CURSOR_SIZE, height: CURSOR_SIZE }}
          >
            <div
              className={cn(
                "relative h-full w-full rounded-full",
                "bg-gradient-to-br from-violet-500 to-magenta-500",
                "shadow-[var(--sh-glow-violet)]",
              )}
            >
              {/* White pointer arrow */}
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 m-auto h-5 w-5 text-white"
                fill="currentColor"
              >
                <path d="M5 3l14 8-6 1-3 7-5-16z" />
              </svg>
              {/* Ripple on click */}
              <AnimatePresence>
                {clicking ? (
                  <motion.span
                    key="ripple"
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border-2 border-magenta-500"
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}

        {/* Tooltip card */}
        {rect ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute glass-strong rounded-xl border border-border-strong",
              "shadow-[var(--sh-3)] p-4 w-[320px]",
            )}
            style={{ left: tooltipX, top: tooltipY }}
          >
            <div className="font-display text-ink-900 text-base">
              {step.title}
            </div>
            <div className="mt-1 text-sm text-ink-500">{step.body}</div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === stepIndex
                        ? "w-5 bg-violet-500"
                        : "w-1.5 bg-ink-300",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-white",
                  "bg-gradient-to-br from-violet-500 via-violet-600 to-magenta-500",
                  "shadow-[var(--sh-2)] hover:shadow-[var(--sh-glow-violet)]",
                  "transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                )}
              >
                {stepIndex < steps.length - 1 ? "Next" : "Done"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
