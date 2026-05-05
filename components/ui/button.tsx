"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
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
    "bg-caspian-500 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] hover:bg-caspian-600",
  secondary: "bg-ink-800 text-white hover:bg-ink-900",
  accent:
    "bg-saffron-400 text-ink-900 shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-saffron-300",
  urgent: "bg-pomegranate-500 text-white hover:bg-pomegranate-600",
  outline:
    "bg-transparent border border-border-strong text-ink-800 hover:bg-ink-50",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-50",
  link: "bg-transparent text-caspian-600 p-0 h-auto hover:underline",
  whatsapp:
    "bg-[#25D366] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1eb957]",
  telegram:
    "bg-[#229ED9] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1d8fc4]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-[15px] rounded-[12px]",
  xl: "h-14 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(15,133,126,0.25)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:translate-y-px",
          variantClasses[variant],
          variant !== "link" && sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
