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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 text-sm text-neutral-100 placeholder:text-neutral-500 transition-all duration-200",
            "focus-visible:outline-none focus-visible:border-[var(--accent)]/40 focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20",
            "disabled:opacity-50 disabled:pointer-events-none",
            icon && "pl-9",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
