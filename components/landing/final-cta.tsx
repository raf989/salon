"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useT } from "@/lib/i18n";

const COPY = {
  eyebrow: { az: "Hazırsan?", ru: "Готов?" },
  titleA: { az: "Vaxtını idarə et —", ru: "Управляй своим временем —" },
  titleB: {
    az: "Vaxt sənin tərəfindədir.",
    ru: "Vaxt на твоей стороне.",
  },
  subtitle: {
    az: "Müştəri tap, ya da müştəri tapdır. Hər iki yol birbaşa burdan başlayır.",
    ru: "Найди клиента или найди исполнителя. Оба пути начинаются здесь.",
  },
  findVendor: { az: "İcraçı tap", ru: "Найти исполнителя" },
  becomeVendor: { az: "İcraçı ol", ru: "Стать исполнителем" },
};

type TrustStat = {
  icon: LucideIcon;
  text: { az: string; ru: string };
};

const TRUST: TrustStat[] = [
  {
    icon: ShieldCheck,
    text: { az: "Verified vendors", ru: "Проверенные исполнители" },
  },
  {
    icon: Sparkles,
    text: { az: "0% komissiya", ru: "0% комиссии" },
  },
  {
    icon: CalendarCheck,
    text: { az: "Anlıq rezerv", ru: "Мгновенная бронь" },
  },
];

const blobs: {
  size: number;
  color: string;
  start: { top: string; left: string };
  drift: { x: number; y: number };
  duration: number;
}[] = [
  {
    size: 320,
    color: "rgba(155,108,246,0.32)",
    start: { top: "-10%", left: "-8%" },
    drift: { x: 30, y: 20 },
    duration: 14,
  },
  {
    size: 280,
    color: "rgba(229,72,180,0.28)",
    start: { top: "60%", left: "85%" },
    drift: { x: -36, y: -24 },
    duration: 18,
  },
  {
    size: 240,
    color: "rgba(80,200,220,0.22)",
    start: { top: "-15%", left: "70%" },
    drift: { x: -20, y: 30 },
    duration: 22,
  },
];

export function FinalCTA() {
  const { pickLocalized } = useT();

  return (
    <section className="relative isolate py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div
          className="glass-strong relative overflow-hidden rounded-3xl px-6 py-20 md:px-12 md:py-28"
          style={{
            background: [
              "radial-gradient(60% 80% at 50% 0%, rgba(229,72,180,0.18), transparent 60%)",
              "radial-gradient(50% 70% at 10% 80%, rgba(155,108,246,0.22), transparent 60%)",
              "radial-gradient(40% 60% at 95% 60%, rgba(80,200,220,0.14), transparent 60%)",
              "conic-gradient(from 220deg at 50% 50%, rgba(155,108,246,0.08), rgba(229,72,180,0.08), rgba(80,200,220,0.06), rgba(155,108,246,0.08))",
            ].join(","),
          }}
        >
          {/* Floating decoration blobs */}
          {blobs.map((b, i) => (
            <motion.div
              key={i}
              aria-hidden
              className="pointer-events-none absolute rounded-full blur-3xl"
              style={{
                width: b.size,
                height: b.size,
                top: b.start.top,
                left: b.start.left,
                background: b.color,
              }}
              animate={{ x: [0, b.drift.x, 0], y: [0, b.drift.y, 0] }}
              transition={{
                duration: b.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Top shimmer line */}
          <div className="shimmer-line absolute inset-x-12 top-0 h-px" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-7 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-violet-200">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-magenta-500 animate-pulse"
              />
              {pickLocalized(COPY.eyebrow)}
            </span>

            <h2 className="font-display text-5xl font-semibold leading-tight text-ink-900 md:text-7xl">
              <span className="block">{pickLocalized(COPY.titleA)}</span>
              <span className="gradient-text-aurora block">
                {pickLocalized(COPY.titleB)}
              </span>
            </h2>

            <p className="max-w-xl text-base text-ink-500 md:text-lg">
              {pickLocalized(COPY.subtitle)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/">
                <MagneticButton variant="primary" size="lg">
                  {pickLocalized(COPY.findVendor)}
                </MagneticButton>
              </Link>
              <Link href="/register">
                <MagneticButton variant="magenta" size="lg">
                  {pickLocalized(COPY.becomeVendor)}
                </MagneticButton>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-ink-400">
              {TRUST.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 ? (
                      <span aria-hidden className="text-ink-500/40">
                        ·
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Icon
                        className="h-3 w-3 text-violet-300"
                        aria-hidden
                      />
                      {pickLocalized(t.text)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
