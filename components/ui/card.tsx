import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface/80 backdrop-blur-md border border-border rounded-[16px] p-6 shadow-[var(--sh-1)] transition-all duration-300",
          interactive &&
            "hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2/80 hover:shadow-[var(--sh-3)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
