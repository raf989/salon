"use client";

import {
  useRef,
  useState,
  useCallback,
  type ButtonHTMLAttributes,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "magenta" | "gold" | "ghost";
type Size = "sm" | "md" | "lg";

export type MagneticButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type Ripple = { id: number; x: number; y: number };

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-violet-500 via-violet-600 to-magenta-500 text-white shadow-[var(--sh-2)] hover:shadow-[var(--sh-glow-violet)]",
  magenta:
    "bg-gradient-to-br from-magenta-500 via-magenta-600 to-gold-500 text-white shadow-[var(--sh-2)] hover:shadow-[var(--sh-glow-magenta)]",
  gold:
    "bg-gradient-to-br from-gold-500 via-gold-600 to-magenta-500 text-ink-900 shadow-[var(--sh-2)] hover:shadow-[var(--sh-glow-gold)]",
  ghost:
    "bg-transparent text-ink-800 border border-border-strong hover:border-violet-500/60 hover:text-ink-900 hover:shadow-[var(--sh-glow-violet)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[10px]",
  md: "h-10 px-5 text-sm rounded-[10px]",
  lg: "h-12 px-6 text-[15px] rounded-[12px]",
};

const RADIUS = 120;

export function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  // Inverse pull for children (text pops further toward cursor).
  const tx = useSpring(x, { stiffness: 260, damping: 16, mass: 0.3 });
  const ty = useSpring(y, { stiffness: 260, damping: 16, mass: 0.3 });

  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleMove = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const k = 0.35 * (1 - dist / RADIUS);
        x.set(dx * k);
        y.set(dy * k);
      }
    },
    [x, y],
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const id = Date.now() + Math.random();
        const rx = e.clientX - r.left;
        const ry = e.clientY - r.top;
        setRipples((prev) => [...prev, { id, x: rx, y: ry }]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((p) => p.id !== id));
        }, 700);
      }
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <motion.button
      ref={ref}
      type={type}
      data-magnetic="true"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={{ x: sx, y: sy }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-[var(--sh-focus)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...(rest as HTMLMotionProps<"button">)}
    >
      <motion.span
        style={{ x: tx, y: ty }}
        className="relative z-10 inline-flex items-center gap-2"
      >
        {children}
      </motion.span>

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: 0, scale: 6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ left: r.x, top: r.y }}
            className="pointer-events-none absolute -ml-12 -mt-12 h-24 w-24 rounded-full bg-white/30"
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
