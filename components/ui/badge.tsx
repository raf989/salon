import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "gold";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-white/[0.06] text-neutral-300 border-white/10",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  gold: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/25",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight border",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
