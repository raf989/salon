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
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-11 w-full rounded-[10px] border border-border-strong bg-surface px-4 text-sm text-ink-800 placeholder:text-ink-400 transition-colors",
            "hover:border-ink-300",
            "focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)]",
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
