"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Placement = "top" | "bottom" | "left" | "right";

export type TooltipProps = {
  content: ReactNode;
  placement?: Placement;
  className?: string;
  children: ReactNode;
};

const placementClasses: Record<Placement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const enterOffset: Record<Placement, { x: number; y: number }> = {
  top: { x: 0, y: 4 },
  bottom: { x: 0, y: -4 },
  left: { x: 4, y: 0 },
  right: { x: -4, y: 0 },
};

type WithEvents = {
  onMouseEnter?: (e: unknown) => void;
  onMouseLeave?: (e: unknown) => void;
  onFocus?: (e: unknown) => void;
  onBlur?: (e: unknown) => void;
};

export function Tooltip({
  content,
  placement = "top",
  className,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  // Clone child to attach hover/focus handlers without an extra wrapper layer
  // that would change layout. Falls back to a span if child isn't a single element.
  let trigger: ReactNode;
  if (isValidElement(children)) {
    const el = children as ReactElement<WithEvents>;
    const existing = el.props ?? {};
    trigger = cloneElement(el, {
      onMouseEnter: (e: unknown) => {
        existing.onMouseEnter?.(e);
        show();
      },
      onMouseLeave: (e: unknown) => {
        existing.onMouseLeave?.(e);
        hide();
      },
      onFocus: (e: unknown) => {
        existing.onFocus?.(e);
        show();
      },
      onBlur: (e: unknown) => {
        existing.onBlur?.(e);
        hide();
      },
    } as WithEvents);
  } else {
    trigger = (
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
    );
  }

  const offset = enterOffset[placement];

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {open ? (
          <motion.span
            initial={{ opacity: 0, x: offset.x, y: offset.y }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: offset.x, y: offset.y }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            role="tooltip"
            className={cn(
              "absolute z-50 pointer-events-none whitespace-nowrap",
              "glass-strong rounded-md px-2.5 py-1.5 text-xs text-ink-100",
              "border border-border-strong shadow-[var(--sh-2)]",
              placementClasses[placement],
              className,
            )}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
