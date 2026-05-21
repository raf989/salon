"use client";

import Link from "next/link";
import {
  AtSign,
  Camera as CameraIcon,
  Send,
  MessageCircle,
  ShieldCheck,
  Zap,
  CalendarCheck,
  Wallet,
} from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { FOOTER_LINKS } from "@/lib/landing-data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COPY = {
  tagline: {
    az: "Bakının vaxtla işləyən marketplace-i. 0% komissiya, real rezerv, real insanlar.",
    ru: "Маркетплейс времени для Баку. 0% комиссии, реальная бронь, реальные люди.",
  },
  categories: { az: "Kateqoriyalar", ru: "Категории" },
  cities: { az: "Şəhərlər", ru: "Города" },
  product: { az: "Məhsul", ru: "Продукт" },
  copyright: { az: "© 2026 BRONELE", ru: "© 2026 BRONELE" },
  fineprint: {
    az: "Bakıda hazırlandı · open-source planlaşdırılır · v0.1",
    ru: "Сделано в Баку · open-source в планах · v0.1",
  },
};

const TRUST_STRIP = [
  { icon: ShieldCheck, text: { az: "Verified vendors", ru: "Проверенные исполнители" } },
  { icon: Wallet, text: { az: "0% komissiya", ru: "0% комиссии" } },
  { icon: Zap, text: { az: "Anlıq rezerv", ru: "Мгновенная бронь" } },
  { icon: CalendarCheck, text: { az: "WhatsApp dəstək", ru: "Поддержка в WhatsApp" } },
];

const SOCIALS = [
  { Icon: AtSign, label: "Twitter" },
  { Icon: CameraIcon, label: "Instagram" },
  { Icon: Send, label: "Telegram" },
  { Icon: MessageCircle, label: "WhatsApp" },
];

export function Footer() {
  const { pickLocalized, lang } = useT();

  return (
    <footer
      className="relative isolate overflow-hidden bg-bg-elevated"
      style={{
        background:
          "radial-gradient(60% 80% at 0% 100%, rgba(155,108,246,0.10), transparent 60%), radial-gradient(40% 60% at 100% 100%, rgba(229,72,180,0.05), transparent 60%)",
      }}
    >
      {/* Top shimmer line */}
      <div className="shimmer-line absolute inset-x-0 top-0 h-px" />

      {/* Trust marquee strip */}
      <div className="border-b border-border bg-bg/40 py-3">
        <Marquee speed={45}>
          {TRUST_STRIP.map((t, i) => {
            const Icon = t.icon;
            return (
              <span
                key={i}
                className="mx-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500"
              >
                <Icon className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                {pickLocalized(t.text)}
              </span>
            );
          })}
        </Marquee>
      </div>

      {/* Main columns */}
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              className="gradient-text-aurora font-display text-3xl font-semibold tracking-tight"
            >
              BRONELE
            </Link>
            <p className="max-w-xs text-sm text-ink-500 leading-relaxed">
              {pickLocalized(COPY.tagline)}
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full",
                    "border border-border bg-surface/60 text-ink-500",
                    "transition-all duration-200 hover:border-violet-500/50 hover:text-violet-300 hover:shadow-[var(--sh-glow-violet)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Categories */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-ink-900">
              {pickLocalized(COPY.categories)}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {FOOTER_LINKS.categories.map((c) => (
                <li key={c.kind}>
                  <Link
                    href={`/?kind=${c.kind}`}
                    className="text-sm text-ink-500 transition-colors hover:text-violet-300"
                  >
                    {pickLocalized(c.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Cities */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-ink-900">
              {pickLocalized(COPY.cities)}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {FOOTER_LINKS.cities.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/?city=${c.id}`}
                    className="text-sm text-ink-500 transition-colors hover:text-violet-300"
                  >
                    {pickLocalized(c.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Product */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-ink-900">
              {pickLocalized(COPY.product)}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {FOOTER_LINKS.product.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="text-sm text-ink-500 transition-colors hover:text-violet-300"
                  >
                    {pickLocalized(p.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 md:flex-row">
          <div className="text-xs text-ink-500">
            {pickLocalized(COPY.copyright)}
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 p-1 text-xs"
            aria-hidden
          >
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 transition-colors",
                lang === "az"
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-ink-500",
              )}
            >
              az
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 transition-colors",
                lang === "ru"
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-ink-500",
              )}
            >
              ru
            </span>
          </div>

          <div className="text-xs text-ink-500">
            {pickLocalized(COPY.fineprint)}
          </div>
        </div>
      </div>
    </footer>
  );
}
