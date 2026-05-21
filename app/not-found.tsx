"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useT } from "@/lib/i18n";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function NotFound() {
  const { t } = useT();
  return (
    <main className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden text-center">
      {/* Backdrop aurora */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 30% 20%, rgba(255,61,157,0.18), transparent 60%), radial-gradient(45% 50% at 70% 20%, rgba(155,108,246,0.18), transparent 60%), radial-gradient(50% 60% at 50% 100%, rgba(34,211,238,0.12), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="flex flex-col items-center max-w-xl"
      >
        {/* Floating logo orbit */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <Logo size="xl" />
        </motion.div>

        {/* 4 0 4 — each digit a glowing orb */}
        <div className="flex items-baseline gap-2 md:gap-4">
          {["4", "0", "4"].map((d, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.25 + i * 0.12,
                ease: EASE_OUT,
              }}
              className="font-display font-semibold text-[120px] md:text-[180px] leading-none gradient-text-aurora"
              style={{ filter: "drop-shadow(0 12px 30px rgba(155,108,246,0.35))" }}
            >
              {d}
            </motion.span>
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: EASE_OUT }}
          className="mt-6 font-display font-semibold text-2xl md:text-3xl text-ink-900"
        >
          {t("notFound.title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
          className="mt-3 text-ink-500 max-w-md"
        >
          {t("notFound.body")}
        </motion.p>

        {/* Decorative orbiting hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/">
            <Button variant="primary" size="md">
              <ArrowLeft className="size-4" strokeWidth={2} />
              {t("notFound.back")}
            </Button>
          </Link>
          <Link href="/tenders">
            <Button variant="ghost" size="md">
              <Compass className="size-4" strokeWidth={1.8} />
              {t("nav.tenders")}
            </Button>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500 font-mono">
            {t("notFound.searchHint")}{" "}
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-border-strong bg-bg-elevated/40 text-[10px] text-ink-300">
              ⌘ K
            </kbd>
            <Search className="size-3" strokeWidth={1.8} />
          </span>
        </motion.div>
      </motion.div>

      {/* Floating decorative orbs */}
      {[
        { x: "10%",  y: "20%", c: "#FF3D9D", d: 0.4 },
        { x: "85%",  y: "25%", c: "#9B6CF6", d: 0.6 },
        { x: "15%",  y: "75%", c: "#22D3EE", d: 0.9 },
        { x: "80%",  y: "70%", c: "#FFB000", d: 1.1 },
      ].map((o, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.7, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: o.d },
            scale: { duration: 0.7, delay: o.d, ease: EASE_OUT },
            y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: o.d },
          }}
          className="absolute size-4 rounded-full blur-[2px] pointer-events-none"
          style={{
            left: o.x,
            top: o.y,
            background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
          }}
        />
      ))}
    </main>
  );
}
