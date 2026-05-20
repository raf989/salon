"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 [&_svg]:size-4 transition-colors">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-11 w-full rounded-[10px] border border-border-strong bg-surface/60 backdrop-blur-sm px-4 text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-200",
            "hover:border-border-strong hover:bg-surface/80",
            "focus:outline-none focus:border-violet-500 focus:bg-surface/80 focus:shadow-[var(--sh-focus)]",
            "disabled:opacity-50 disabled:pointer-events-none",
            icon && "pl-11",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
