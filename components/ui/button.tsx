"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "accent"
  | "urgent"
  | "outline"
  | "ghost"
  | "link"
  | "whatsapp"
  | "telegram";
type Size = "sm" | "md" | "lg" | "xl";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-violet-500 via-violet-600 to-magenta-500 text-white shadow-[var(--sh-2)] hover:-translate-y-px hover:shadow-[var(--sh-glow-violet)]",
  secondary:
    "bg-surface text-ink-900 border border-border-strong hover:bg-surface-2 hover:border-violet-500/40",
  accent:
    "bg-gradient-to-br from-gold-500 to-gold-600 text-ink-900 shadow-[var(--sh-2)] hover:-translate-y-px hover:shadow-[var(--sh-glow-gold)]",
  urgent:
    "bg-gradient-to-br from-magenta-500 to-magenta-600 text-white shadow-[var(--sh-2)] hover:-translate-y-px hover:shadow-[var(--sh-glow-magenta)]",
  outline:
    "bg-transparent border border-border-strong text-ink-800 hover:bg-surface-2 hover:border-violet-500/50 hover:text-ink-900",
  ghost: "bg-transparent text-ink-700 hover:bg-surface-2 hover:text-ink-900",
  link: "bg-transparent text-caspian-600 p-0 h-auto hover:text-caspian-500 hover:underline",
  whatsapp:
    "bg-[#25D366] text-white shadow-[var(--sh-2)] hover:-translate-y-px hover:bg-[#1eb957]",
  telegram:
    "bg-[#229ED9] text-white shadow-[var(--sh-2)] hover:-translate-y-px hover:bg-[#1d8fc4]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-[15px] rounded-[12px]",
  xl: "h-14 px-8 text-base",
};

const MotionButton = motion.button;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => {
    return (
      <MotionButton
        ref={ref}
        type={type}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:shadow-[var(--sh-focus)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap",
          variantClasses[variant],
          variant !== "link" && sizeClasses[size],
          className,
        )}
        {...(props as HTMLMotionProps<"button">)}
      />
    );
  },
);

Button.displayName = "Button";
