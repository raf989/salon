"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Cover } from "@/components/ui/cover";
import { useT } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

type Props = {
  provider: Provider;
};

const VISIBLE = 4;

export function GalleryGrid({ provider }: Props) {
  const { t } = useT();
  const gallery = useMemo(() => provider.gallery ?? [], [provider.gallery]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cells: { key: string; src: string | null; galleryIdx: number }[] = [];
  for (let i = 0; i < VISIBLE; i++) {
    if (i < gallery.length) {
      cells.push({ key: `img-${i}`, src: gallery[i], galleryIdx: i });
    } else {
      cells.push({ key: `cv-${i}`, src: null, galleryIdx: -1 });
    }
  }
  const remaining = Math.max(0, gallery.length - VISIBLE);

  const showPrev = useCallback(() => {
    if (lightboxIndex === null || gallery.length <= 1) return;
    setLightboxIndex(
      (lightboxIndex - 1 + gallery.length) % gallery.length,
    );
  }, [lightboxIndex, gallery.length]);

  const showNext = useCallback(() => {
    if (lightboxIndex === null || gallery.length <= 1) return;
    setLightboxIndex((lightboxIndex + 1) % gallery.length);
  }, [lightboxIndex, gallery.length]);

  // Keyboard navigation in lightbox.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, showPrev, showNext]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t("provider.gallery")}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cells.map((cell, i) => {
          const isLast = i === VISIBLE - 1;
          const clickable = cell.src !== null;
          return (
            <motion.button
              type="button"
              key={cell.key}
              whileHover={clickable ? { scale: 1.02 } : undefined}
              whileTap={clickable ? { scale: 0.98 } : undefined}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              onClick={() => {
                if (cell.galleryIdx >= 0) setLightboxIndex(cell.galleryIdx);
              }}
              disabled={!clickable}
              className="relative aspect-square rounded-xl overflow-hidden block group focus:outline-none focus-visible:shadow-[var(--sh-focus)] hover:shadow-[var(--sh-glow-violet)] transition-shadow"
            >
              {cell.src ? (
                <Image
                  src={cell.src}
                  alt={`${provider.name} ${i + 1}`}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <Cover
                  name={provider.name}
                  id={`${provider.id}_${cell.key}`}
                  kind={provider.kind}
                  aspect="1"
                  className="rounded-none h-full"
                />
              )}
              {isLast && remaining > 0 ? (
                <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-[1px] grid place-items-center text-white font-display font-bold text-2xl md:text-xl tracking-tight">
                  +{remaining}
                </div>
              ) : null}
            </motion.button>
          );
        })}
      </div>
      {gallery.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">
          {t("provider.gallery.empty")}
        </p>
      ) : null}

      {mounted &&
        lightboxIndex !== null &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-strong fixed inset-0 z-[120] grid place-items-center p-4 sm:p-8"
              onClick={() => setLightboxIndex(null)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-5xl aspect-[4/3] rounded-2xl overflow-hidden shadow-[var(--sh-glow-violet)]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={gallery[lightboxIndex]}
                  alt={`${provider.name} ${lightboxIndex + 1}`}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-contain bg-bg/80"
                />
              </motion.div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 h-10 w-10 rounded-full glass-strong border border-border-strong text-ink-900 grid place-items-center hover:shadow-[var(--sh-glow-violet)] transition-shadow"
              >
                <X className="size-5" />
              </button>

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={(e) => {
                      e.stopPropagation();
                      showPrev();
                    }}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full glass-strong border border-border-strong text-ink-900 grid place-items-center hover:shadow-[var(--sh-glow-violet)] transition-shadow"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={(e) => {
                      e.stopPropagation();
                      showNext();
                    }}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full glass-strong border border-border-strong text-ink-900 grid place-items-center hover:shadow-[var(--sh-glow-violet)] transition-shadow"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </motion.section>
  );
}
