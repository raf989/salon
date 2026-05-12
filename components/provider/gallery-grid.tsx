"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Cover } from "@/components/ui/cover";
import { useT } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

type Props = {
  provider: Provider;
};

const VISIBLE = 4;

export function GalleryGrid({ provider }: Props) {
  const { t } = useT();
  const gallery = provider.gallery ?? [];

  const cells: { key: string; src: string | null }[] = [];
  for (let i = 0; i < VISIBLE; i++) {
    if (i < gallery.length) {
      cells.push({ key: `img-${i}`, src: gallery[i] });
    } else {
      cells.push({ key: `cv-${i}`, src: null });
    }
  }
  const remaining = Math.max(0, gallery.length - VISIBLE);

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
          return (
            <div
              key={cell.key}
              className="relative aspect-square rounded-xl overflow-hidden"
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
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
