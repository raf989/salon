"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const { t } = useT();
  // Mount into a portal so the dialog escapes any ancestor's transform /
  // filter / will-change — those create new containing blocks and make
  // `position: fixed` scoped to the ancestor instead of the viewport.
  // Catalog cards use framer-motion (transforms), which caused the
  // backdrop to cover only one card's height instead of the whole page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog-root"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            aria-hidden
            // Opaque dark vail does the hiding (works everywhere); the
            // inline backdrop-filter adds blur on Chromium/WebKit. Older
            // Firefox without backdrop-filter still gets the dark layer.
            className="absolute inset-0 bg-ink-900/80"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative w-full max-w-lg bg-surface rounded-[16px] shadow-[0_24px_48px_rgba(14,13,11,0.12)] p-6",
              className,
            )}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              {title ? (
                <h2 className="font-display font-semibold text-2xl text-ink-900 leading-tight">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="text-ink-500 hover:text-ink-900 transition-colors p-1.5 rounded-md hover:bg-ink-50 -mt-1 -mr-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
