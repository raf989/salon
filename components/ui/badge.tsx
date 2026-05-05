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
  default: "bg-ink-50 text-ink-700",
  "success-soft": "bg-success-50 text-success-500",
  "warning-soft": "bg-warning-50 text-warning-500",
  "danger-soft": "bg-danger-50 text-danger-500",
  "info-soft": "bg-info-50 text-info-500",
  verified: "bg-caspian-500 text-white",
  promo: "bg-saffron-400 text-ink-900",
  urgent: "bg-pomegranate-500 text-white",
  event: "bg-plum-500/10 text-plum-500",
  beauty: "bg-rose-500/10 text-rose-500",
};

const dotClasses: Record<Variant, string> = {
  default: "bg-ink-400",
  "success-soft": "bg-success-500",
  "warning-soft": "bg-warning-500",
  "danger-soft": "bg-danger-500",
  "info-soft": "bg-info-500",
  verified: "bg-white",
  promo: "bg-ink-900",
  urgent: "bg-white",
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
          "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-tight",
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
