"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  layoutId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

let tabsIdCounter = 0;

export type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: ReactNode;
};

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  const layoutId = useMemo(
    () => `tabs-underline-${++tabsIdCounter}`,
    [],
  );
  const ctx = useMemo(
    () => ({ value, setValue: onValueChange, layoutId }),
    [value, onValueChange, layoutId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TabsListProps = {
  className?: string;
  children: ReactNode;
};

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative flex items-center gap-1 border-b border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type TabsTriggerProps = {
  value: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
};

export function TabsTrigger({
  value,
  className,
  children,
  disabled,
}: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "relative px-4 py-2 text-sm transition-colors outline-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        active
          ? "text-ink-900 font-medium"
          : "text-ink-500 hover:text-ink-700",
        className,
      )}
    >
      {children}
      {active ? (
        <motion.div
          layoutId={ctx.layoutId}
          className={cn(
            "absolute left-0 right-0 -bottom-px h-px",
            "bg-gradient-to-r from-magenta-500 via-violet-500 to-cyan-500",
          )}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
    </button>
  );
}

export type TabsContentProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

export function TabsContent({ value, className, children }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div
          key={value}
          role="tabpanel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("py-4", className)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
