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
          "bg-surface border border-border rounded-[16px] p-6",
          interactive &&
            "transition-shadow transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(14,13,11,0.08),0_2px_6px_rgba(14,13,11,0.05)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
