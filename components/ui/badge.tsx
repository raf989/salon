import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success-soft"
  | "warning-soft"
  | "danger-soft"
  | "info-soft"
  | "verified"
  | "promo"
  | "urgent"
  | "event"
  | "beauty";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  pulse?: boolean;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-surface-2 text-ink-700 border border-border",
  "success-soft":
    "bg-success-500/15 text-success-500 border border-success-500/30",
  "warning-soft":
    "bg-warning-500/15 text-warning-500 border border-warning-500/30",
  "danger-soft":
    "bg-danger-500/15 text-danger-500 border border-danger-500/30",
  "info-soft": "bg-info-500/15 text-info-500 border border-info-500/30",
  verified:
    "bg-caspian-500/15 text-caspian-600 border border-caspian-500/30",
  promo:
    "bg-gold-500/15 text-gold-500 border border-gold-500/30",
  urgent:
    "bg-magenta-500/15 text-magenta-500 border border-magenta-500/30",
  event: "bg-plum-500/15 text-plum-500 border border-plum-500/30",
  beauty: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
};

const dotClasses: Record<Variant, string> = {
  default: "bg-ink-400",
  "success-soft": "bg-success-500",
  "warning-soft": "bg-warning-500",
  "danger-soft": "bg-danger-500",
  "info-soft": "bg-info-500",
  verified: "bg-caspian-500",
  promo: "bg-gold-500",
  urgent: "bg-magenta-500",
  event: "bg-plum-500",
  beauty: "bg-rose-500",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "default", pulse = false, children, ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-tight backdrop-blur-sm",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {pulse ? (
          <span
            className={cn(
              "size-1.5 rounded-full animate-pulse",
              dotClasses[variant],
            )}
          />
        ) : null}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
