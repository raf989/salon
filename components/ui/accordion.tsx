"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

type ItemContextValue = {
  value: string;
  open: boolean;
};

const ItemContext = createContext<ItemContextValue | null>(null);

export type AccordionProps = {
  type?: AccordionType;
  defaultValue?: string | string[];
  className?: string;
  children: ReactNode;
};

export function Accordion({
  type = "single",
  defaultValue,
  className,
  children,
}: AccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>(() => {
    if (Array.isArray(defaultValue)) return defaultValue;
    if (typeof defaultValue === "string") return [defaultValue];
    return [];
  });

  const isOpen = useCallback(
    (value: string) => openValues.includes(value),
    [openValues],
  );

  const toggle = useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        const has = prev.includes(value);
        if (type === "single") return has ? [] : [value];
        return has ? prev.filter((v) => v !== value) : [...prev, value];
      });
    },
    [type],
  );

  const ctx = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

export function AccordionItem({
  value,
  className,
  children,
}: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  const open = ctx?.isOpen(value) ?? false;
  const itemCtx = useMemo(() => ({ value, open }), [value, open]);
  return (
    <ItemContext.Provider value={itemCtx}>
      <div className={cn("border-b border-border", className)}>{children}</div>
    </ItemContext.Provider>
  );
}

export type AccordionTriggerProps = {
  className?: string;
  children: ReactNode;
};

export function AccordionTrigger({
  className,
  children,
}: AccordionTriggerProps) {
  const ctx = useContext(AccordionContext);
  const item = useContext(ItemContext);
  if (!ctx || !item) return null;

  return (
    <button
      type="button"
      onClick={() => ctx.toggle(item.value)}
      aria-expanded={item.open}
      className={cn(
        "flex w-full items-center justify-between gap-4 py-4 px-1 text-left",
        "font-display text-ink-900 transition-colors",
        "hover:text-violet-400 focus:outline-none focus-visible:text-violet-400",
        className,
      )}
    >
      <span className="flex-1">{children}</span>
      <motion.span
        animate={{ rotate: item.open ? 180 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 text-ink-500"
      >
        <ChevronDown className="h-4 w-4" />
      </motion.span>
    </button>
  );
}

export type AccordionContentProps = {
  className?: string;
  children: ReactNode;
};

export function AccordionContent({
  className,
  children,
}: AccordionContentProps) {
  const item = useContext(ItemContext);
  if (!item) return null;

  return (
    <AnimatePresence initial={false}>
      {item.open ? (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div className={cn("py-4 px-1 text-ink-500 text-sm", className)}>
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
