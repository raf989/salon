import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
