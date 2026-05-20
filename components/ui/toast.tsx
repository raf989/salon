"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant =
  | "default"
  | "success"
  | "magenta"
  | "violet"
  | "gold"
  | "danger";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastOptions & { id: number };

type ToastContextValue = {
  toast: (opts: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantAccent: Record<ToastVariant, string> = {
  default: "bg-violet-500",
  violet: "bg-violet-500",
  success: "bg-success-500",
  magenta: "bg-magenta-500",
  gold: "bg-gold-500",
  danger: "bg-danger-500",
};

const variantGlow: Record<ToastVariant, string> = {
  default: "shadow-[var(--sh-glow-violet)]",
  violet: "shadow-[var(--sh-glow-violet)]",
  success: "",
  magenta: "shadow-[var(--sh-glow-magenta)]",
  gold: "shadow-[var(--sh-glow-gold)]",
  danger: "",
};

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++toastIdCounter;
    const item: ToastItem = {
      id,
      duration: 4000,
      variant: "default",
      ...opts,
    };
    setToasts((prev) => [...prev, item]);
    if (item.duration && item.duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);
    }
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[100] flex flex-col gap-2",
              "right-4 bottom-4 sm:right-6 sm:bottom-6",
              "max-sm:right-4 max-sm:left-4 max-sm:top-4 max-sm:bottom-auto",
            )}
            aria-live="polite"
          >
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: 40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "pointer-events-auto group relative w-full max-w-[360px] overflow-hidden",
                    "glass-strong rounded-xl border border-border-strong",
                    "px-4 py-3 shadow-[var(--sh-3)]",
                    variantGlow[t.variant ?? "default"],
                  )}
                  role="status"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-[3px]",
                      variantAccent[t.variant ?? "default"],
                    )}
                  />
                  <div className="flex items-start gap-3 pl-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900">
                        {t.title}
                      </div>
                      {t.description ? (
                        <div className="mt-0.5 text-xs text-ink-500">
                          {t.description}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      aria-label="Dismiss"
                      className={cn(
                        "shrink-0 rounded-md p-1 text-ink-400 transition-opacity",
                        "opacity-0 group-hover:opacity-100 hover:text-ink-900",
                        "focus:outline-none focus:opacity-100",
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op so usage outside provider doesn't crash builds.
    return {
      toast: () => {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("useToast() called outside <ToastProvider>");
        }
      },
    };
  }
  return ctx;
}
