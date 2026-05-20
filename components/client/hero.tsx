"use client";

import { motion, type Variants } from "framer-motion";
import {
  Search,
  ArrowRight,
  Camera,
  Film,
  Music,
  Guitar,
  Utensils,
  ChefHat,
  Mic,
  Wand2,
  Flower2,
  Scissors,
  Sparkles,
  Brush,
  Hand,
  Eye,
  Droplet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { useT } from "@/lib/i18n";

type Props = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit?: () => void;
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

// Typewriter phrases — short noun forms that fit on a single line below the title.
const TYPEWRITER: { az: string[]; ru: string[] } = {
  az: ["fotoqraf", "DJ", "vizajist", "aparıcı", "florist", "dekorator", "barber"],
  ru: ["фотографа", "DJ", "визажиста", "ведущего", "флориста", "декоратора", "барбера"],
};

// Preview-strip cards — these are SERVICE-TYPE previews (not specific vendors).
// Clicking deep-links into the catalog with that category filter.
type PreviewCard = {
  kind: string;
  icon: LucideIcon;
  title: { az: string; ru: string };
  tag: { az: string; ru: string };
  grad: string;
};

const PREVIEW_CARDS: PreviewCard[] = [
  { kind: "photographer", icon: Camera,   title: { az: "Fotoqraf",     ru: "Фотограф"     }, tag: { az: "Toy çəkiliş",      ru: "Свадебная съёмка"     }, grad: "from-magenta-500 via-magenta-600 to-violet-700" },
  { kind: "videographer", icon: Film,     title: { az: "Videooperator", ru: "Видеооператор" }, tag: { az: "After-movie",       ru: "After-movie"          }, grad: "from-violet-600 via-magenta-500 to-gold-500" },
  { kind: "dj",           icon: Music,    title: { az: "DJ",           ru: "DJ"           }, tag: { az: "Korporativ · toy",  ru: "Корпоратив · свадьба"  }, grad: "from-violet-500 via-violet-600 to-cyan-500" },
  { kind: "band",         icon: Guitar,   title: { az: "Canlı musiqi",  ru: "Живая музыка"  }, tag: { az: "Caz, akustika",     ru: "Джаз, акустика"        }, grad: "from-magenta-600 via-violet-700 to-cyan-500" },
  { kind: "makeup",       icon: Sparkles, title: { az: "Vizajist",     ru: "Визажист"     }, tag: { az: "Bridal · gala",      ru: "Свадебный · гала"      }, grad: "from-magenta-500 via-magenta-400 to-gold-500" },
  { kind: "host",         icon: Mic,      title: { az: "Aparıcı",      ru: "Ведущий"      }, tag: { az: "Toy · ad günü",      ru: "Свадьба · юбилей"      }, grad: "from-violet-700 via-violet-500 to-magenta-500" },
  { kind: "decorator",    icon: Wand2,    title: { az: "Dekorator",    ru: "Декоратор"    }, tag: { az: "Arka, photo-zone",   ru: "Арка, фотозона"        }, grad: "from-cyan-500 via-magenta-500 to-violet-700" },
  { kind: "florist",      icon: Flower2,  title: { az: "Florist",      ru: "Флорист"      }, tag: { az: "Gəlin dəstəsi",      ru: "Букет невесты"          }, grad: "from-gold-500 via-magenta-500 to-violet-700" },
  { kind: "restaurant",   icon: Utensils, title: { az: "Restoran",     ru: "Ресторан"     }, tag: { az: "Banket · terras",    ru: "Банкет · терраса"      }, grad: "from-gold-500 via-magenta-500 to-violet-700" },
  { kind: "catering",     icon: ChefHat,  title: { az: "Keytering",    ru: "Кейтеринг"    }, tag: { az: "Açıq tədbir",        ru: "Опен-эйр"               }, grad: "from-gold-500 via-gold-400 to-magenta-500" },
  { kind: "barber",       icon: Scissors, title: { az: "Barber",       ru: "Барбер"       }, tag: { az: "Skin fade · sakal",   ru: "Skin fade · борода"    }, grad: "from-cyan-500 via-violet-500 to-violet-700" },
  { kind: "salon",        icon: Brush,    title: { az: "Salon",        ru: "Салон"        }, tag: { az: "Saç, styling",        ru: "Волосы, укладка"        }, grad: "from-violet-700 via-magenta-600 to-magenta-500" },
  { kind: "nails",        icon: Hand,     title: { az: "Manikür",      ru: "Маникюр"      }, tag: { az: "Naxış, gel-lak",      ru: "Дизайн, гель-лак"       }, grad: "from-magenta-400 via-magenta-500 to-violet-600" },
  { kind: "brows",        icon: Eye,      title: { az: "Qaş və kirpik", ru: "Брови / ресницы" }, tag: { az: "Laminasiya",     ru: "Ламинация"              }, grad: "from-violet-500 via-magenta-500 to-gold-500" },
  { kind: "cosmetologist",icon: Droplet,  title: { az: "Kosmetoloq",   ru: "Косметолог"   }, tag: { az: "Üz qulluğu",         ru: "Уход за лицом"          }, grad: "from-cyan-500 via-violet-500 to-magenta-500" },
];

export function Hero({ searchValue, onSearchChange, onSearchSubmit }: Props) {
  const { t, lang, pickLocalized } = useT();
  const phrases = TYPEWRITER[lang === "ru" ? "ru" : "az"];

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(155,108,246,0.18), transparent 65%), radial-gradient(40% 40% at 90% 10%, rgba(255,61,157,0.14), transparent 60%), radial-gradient(40% 50% at 8% 30%, rgba(34,211,238,0.10), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-14 md:pt-24 pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-strong glass text-[11px] md:text-xs font-medium text-ink-700 shadow-[var(--sh-1)]">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 rounded-full bg-magenta-500 animate-ping opacity-80" />
                <span className="relative rounded-full size-1.5 bg-magenta-500" />
              </span>
              <span className="text-ink-800">
                {pickLocalized({
                  az: "Bakı · Tədbir & Gözəllik marketplace",
                  ru: "Баку · маркетплейс мероприятий и красоты",
                })}
              </span>
            </div>
          </motion.div>

          {/* Big editorial headline */}
          <motion.h1
            variants={itemVariants}
            className="mt-7 font-display font-semibold text-[44px] sm:text-[72px] md:text-[96px] lg:text-[112px] leading-[0.97] tracking-[-0.03em] text-ink-900 max-w-5xl"
          >
            <span className="block italic font-medium relative" style={{ minHeight: "1em" }}>
              <GooeyMorph phrases={phrases} />
            </span>
            <span className="block text-ink-700">
              {pickLocalized({
                az: "90 saniyə içində tap.",
                ru: "Найди за 90 секунд.",
              })}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-base md:text-lg text-ink-500 leading-relaxed"
          >
            {pickLocalized({
              az: "15 kateqoriya, verifikasiyadan keçmiş icraçılar, anlıq rezerv, 0% komissiya.",
              ru: "15 категорий, проверенные исполнители, мгновенная бронь, 0% комиссии.",
            })}
          </motion.p>

          {/* Search bar */}
          <motion.form
            variants={itemVariants}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit?.();
            }}
            className="mt-9 md:mt-11 flex items-center h-14 md:h-16 w-full max-w-2xl glass-strong rounded-2xl border border-border-strong shadow-[var(--sh-3)] pl-4 md:pl-5 pr-1.5 focus-within:border-violet-500/60 focus-within:shadow-[var(--sh-glow-violet)] transition-all"
          >
            <Search className="size-5 text-ink-400 shrink-0" strokeWidth={1.6} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={pickLocalized({
                az: "Kateqoriya, şəhər və ya xidmət…",
                ru: "Категория, город или услуга…",
              })}
              aria-label={t("filters.search.aria")}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] md:text-base font-medium text-ink-900 placeholder:text-ink-500 placeholder:font-normal ml-3"
            />
            <kbd className="hidden md:inline-flex items-center gap-1 mr-2 px-2 py-1 rounded-md text-[10px] font-mono text-ink-500 border border-border-strong bg-bg-elevated/40">
              ⌘ K
            </kbd>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="shrink-0 ml-1 md:h-12 md:px-6 md:text-[15px] md:rounded-[12px]"
              aria-label={t("filters.search.button")}
            >
              <span className="hidden sm:inline">{t("filters.search.button")}</span>
              <Search className="size-5 sm:hidden" strokeWidth={2} />
            </Button>
          </motion.form>

          {/* Honest trust hints — no fake numbers */}
          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-ink-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-violet-400" />
              {pickLocalized({ az: "Verifikasiya", ru: "Верификация" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-magenta-500" />
              {pickLocalized({ az: "0% komissiya", ru: "0% комиссии" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-cyan-400" />
              {pickLocalized({ az: "WhatsApp birbaşa", ru: "WhatsApp напрямую" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-gold-500" />
              {pickLocalized({ az: "AZ + RU", ru: "AZ + RU" })}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Below-fold: dual marquee preview strip — what the catalog looks like.
          Each tile is a service-type preview (links to the catalog filter). */}
      <PreviewStrip lang={lang} pickLocalized={pickLocalized} />
    </section>
  );
}

// ─── GooeyMorph — alpha-threshold blob morph between words ──────────────
// Pattern from victorwelander/gooey-text-morphing (21st.dev):
// the SVG filter is JUST a color-matrix threshold; per-span blur is set
// inline. Threshold turns blurred alpha edges into sharp blobs that merge.
function GooeyMorph({
  phrases,
  morphTime = 1,
  cooldownTime = 0.25,
}: {
  phrases: readonly string[];
  morphTime?: number;
  cooldownTime?: number;
}) {
  const text1Ref = useRef<HTMLSpanElement | null>(null);
  const text2Ref = useRef<HTMLSpanElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const visibleRef = useRef(true);

  // Pause RAF when offscreen. The whole hero is a candidate to scroll past,
  // and there's no reason to keep morphing while the user is below the fold.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!phrases.length) return;
    let textIndex = phrases.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction: number) => {
      if (!text1Ref.current || !text2Ref.current) return;
      text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      const inv = 1 - fraction;
      text1Ref.current.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      text1Ref.current.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    };

    const doCooldown = () => {
      morph = 0;
      if (!text1Ref.current || !text2Ref.current) return;
      text2Ref.current.style.filter = "";
      text2Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter = "";
      text1Ref.current.style.opacity = "0%";
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setMorph(fraction);
    };

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      // Skip work when scrolled out of view — saves the entire RAF tree.
      if (!visibleRef.current) {
        time = new Date();
        return;
      }
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % phrases.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = phrases[textIndex % phrases.length];
            text2Ref.current.textContent =
              phrases[(textIndex + 1) % phrases.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [phrases, morphTime, cooldownTime]);

  // Width-anchor: invisible span sized to longest phrase keeps layout stable.
  const longest = phrases.reduce(
    (a, b) => (a.length >= b.length ? a : b),
    phrases[0] ?? "",
  );

  return (
    <span ref={wrapRef} className="relative inline-block align-baseline">
      {/* Threshold filter — color-matrix only, no blur here. */}
      <svg className="absolute h-0 w-0" aria-hidden focusable="false">
        <defs>
          <filter id="vaxt-gooey">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* Invisible width anchor */}
      <span aria-hidden className="invisible inline-block whitespace-nowrap">
        {longest}
      </span>

      {/* Threshold-wrapped morph layer */}
      <span
        className="absolute inset-0 inline-flex items-center justify-center whitespace-nowrap"
        style={{ filter: "url(#vaxt-gooey)" }}
      >
        <span
          ref={text1Ref}
          className="absolute inline-block select-none text-magenta-400"
        />
        <span
          ref={text2Ref}
          className="absolute inline-block select-none text-magenta-400"
        />
      </span>
    </span>
  );
}

// ─── PreviewStrip: dual auto-scrolling marquee of service-type cards ────
function PreviewStrip({
  lang,
  pickLocalized,
}: {
  lang: string;
  pickLocalized: (v: { az: string; ru: string }) => string;
}) {
  // Slice into two interleaved rows so the marquees feel varied.
  const rowA = PREVIEW_CARDS.filter((_, i) => i % 2 === 0);
  const rowB = PREVIEW_CARDS.filter((_, i) => i % 2 === 1);

  return (
    <div
      aria-hidden={false}
      className="relative mt-2 md:mt-6 pb-12 md:pb-16 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <Marquee speed={70} pauseOnHover className="py-3">
        {rowA.map((c) => (
          <PreviewTile key={`a-${c.kind}`} card={c} pickLocalized={pickLocalized} size="md" />
        ))}
      </Marquee>
      <Marquee speed={55} direction="right" pauseOnHover className="py-3 mt-3">
        {rowB.map((c) => (
          <PreviewTile key={`b-${c.kind}`} card={c} pickLocalized={pickLocalized} size="md" />
        ))}
      </Marquee>
      {/* Faint hint of language to localize SR */}
      <span className="sr-only">{lang}</span>
    </div>
  );
}

function PreviewTile({
  card,
  pickLocalized,
  size,
}: {
  card: PreviewCard;
  pickLocalized: (v: { az: string; ru: string }) => string;
  size: "md" | "lg";
}) {
  const Icon = card.icon;
  const dims =
    size === "lg" ? "w-[260px] h-[110px]" : "w-[220px] h-[96px]";
  return (
    <Link
      href={`/?kind=${card.kind}`}
      className={`group relative ${dims} mx-2 shrink-0 rounded-2xl overflow-hidden border border-border-strong shadow-[var(--sh-2)] transition-transform duration-300 hover:-translate-y-1 hover:border-violet-500/50`}
    >
      {/* Gradient bg with subtle pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${card.grad}`} />
      {/* Soft dark vignette so text reads */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      {/* Decorative giant icon in corner */}
      <Icon
        className="absolute -right-3 -bottom-2 size-20 text-white/15 group-hover:text-white/25 transition-colors"
        strokeWidth={1.2}
      />
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-3.5">
        <div className="flex items-start gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-white/15 backdrop-blur-sm">
            <Icon className="size-3.5 text-white" strokeWidth={2} />
          </span>
          <ArrowRight className="ml-auto size-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition" />
        </div>
        <div className="leading-tight text-white">
          <div className="font-display font-semibold text-[15px] tracking-tight drop-shadow-sm">
            {pickLocalized(card.title)}
          </div>
          <div className="text-[11px] opacity-85 truncate">
            {pickLocalized(card.tag)}
          </div>
        </div>
      </div>
    </Link>
  );
}
