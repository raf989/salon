"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { STYLISTS, SERVICES } from "@/lib/mock-data";

export function Hero() {
  const stylistCount = STYLISTS.length;
  const serviceCount = SERVICES.length;
  const avgRating = (
    STYLISTS.reduce((sum, s) => sum + s.rating, 0) / STYLISTS.length
  ).toFixed(1);

  return (
    <section className="relative isolate overflow-hidden pb-12 pt-6 md:pb-16 md:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--accent)]/15 blur-[120px]" />
        <div className="absolute right-[10%] top-20 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-[90px]" />
        <div className="absolute left-[5%] top-32 h-48 w-48 rounded-full bg-white/[0.04] blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-medium tracking-tight text-[var(--accent)] backdrop-blur-xl"
        >
          <Sparkles className="size-3" />
          Premium görüş təcrübəsi
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-50 sm:text-5xl md:text-6xl"
        >
          Şəhərinizin{" "}
          <span className="bg-gradient-to-r from-[var(--accent)] via-[#e9c899] to-[var(--accent)] bg-clip-text text-transparent">
            ən yaxşı
          </span>{" "}
          stilistləri
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-xl text-balance text-base text-neutral-400 sm:text-lg"
        >
          Bir neçə klikdə görüş təyin edin və premium xidmətdən həzz alın.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: "easeOut" }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-neutral-500 sm:text-sm"
        >
          <span>{stylistCount} usta</span>
          <span aria-hidden className="text-neutral-700">
            ·
          </span>
          <span>{serviceCount} xidmət</span>
          <span aria-hidden className="text-neutral-700">
            ·
          </span>
          <span className="text-neutral-300">
            <span className="text-[var(--accent)]">{avgRating}★</span> orta
            reytinq
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
