"use client";

import { AnimatePresence, motion } from "framer-motion";
import { lockBodyScroll } from "@/lib/scroll-lock";
import {
  Search,
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
  Briefcase,
  Heart,
  LayoutDashboard,
  Star,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  group: "category" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: "violet" | "magenta" | "cyan" | "gold";
  badge?: string;
};

const CATEGORY_OPTIONS: Array<{
  kind: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  az: string;
  ru: string;
}> = [
  { kind: "photographer",   icon: Camera,   az: "Fotoqraflar",        ru: "Фотографы" },
  { kind: "videographer",   icon: Film,     az: "Videooperatorlar",   ru: "Видеооператоры" },
  { kind: "dj",             icon: Music,    az: "DJ-lər",             ru: "DJ-и" },
  { kind: "band",           icon: Guitar,   az: "Canlı musiqi",        ru: "Живая музыка" },
  { kind: "makeup",         icon: Sparkles, az: "Vizajistlər",        ru: "Визажисты" },
  { kind: "host",           icon: Mic,      az: "Aparıcılar",         ru: "Ведущие" },
  { kind: "decorator",      icon: Wand2,    az: "Dekoratorlar",       ru: "Декораторы" },
  { kind: "florist",        icon: Flower2,  az: "Floristlər",         ru: "Флористы" },
  { kind: "restaurant",     icon: Utensils, az: "Restoranlar",        ru: "Рестораны" },
  { kind: "catering",       icon: ChefHat,  az: "Keytering",          ru: "Кейтеринг" },
  { kind: "barber",         icon: Scissors, az: "Barberlər",          ru: "Барберы" },
  { kind: "salon",          icon: Brush,    az: "Salonlar",           ru: "Салоны" },
  { kind: "nails",          icon: Hand,     az: "Manikür ustaları",   ru: "Маникюр" },
  { kind: "brows",          icon: Eye,      az: "Qaş və kirpik",      ru: "Брови и ресницы" },
  { kind: "cosmetologist",  icon: Droplet,  az: "Kosmetoloqlar",      ru: "Косметологи" },
];

const PAGE_OPTIONS: Array<{
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  az: string;
  ru: string;
}> = [
  { href: "/tenders",   icon: Briefcase,       az: "Tenderlər",   ru: "Тендеры" },
  { href: "/favorites", icon: Heart,           az: "Sevimlilər", ru: "Избранное" },
  { href: "/dashboard", icon: LayoutDashboard, az: "Dashboard",   ru: "Дашборд" },
  { href: "/my-bids",   icon: Star,            az: "Mənim təkliflərim", ru: "Мои ставки" },
];

/**
 * Cmd-K command palette: keyboard-driven global search.
 * Opens with Cmd-K / Ctrl-K. Arrow keys + Enter navigate. Esc closes.
 * Searches across vendors, categories, services, pages — uses mock seed
 * data so it works in stub mode.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { lang, pickLocalized } = useT();
  const isRu = lang === "ru";

  // Global keyboard + custom-event listener (header button dispatches the
  // custom event so it opens the palette without faking a keyboard event).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("vaxt:open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("vaxt:open-command-palette", onOpen);
    };
  }, [open]);

  // Auto-focus input + reset query when reopening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Lock body scroll when open (ref-counted — see lib/scroll-lock so this
  // doesn't fight a Dialog that's open underneath the palette).
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  // Compute filtered results — vendors / categories / services / pages
  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const result: Item[] = [];

    // Categories
    for (const cat of CATEGORY_OPTIONS) {
      const label = isRu ? cat.ru : cat.az;
      if (!q || label.toLowerCase().includes(q)) {
        result.push({
          id: `cat-${cat.kind}`,
          group: "category",
          title: label,
          subtitle: isRu ? "Категория" : "Kateqoriya",
          href: `/?kind=${cat.kind}`,
          icon: cat.icon,
          accent: "violet",
        });
      }
    }

    // Pages
    for (const p of PAGE_OPTIONS) {
      const label = isRu ? p.ru : p.az;
      if (!q || label.toLowerCase().includes(q)) {
        result.push({
          id: `page-${p.href}`,
          group: "page",
          title: label,
          subtitle: isRu ? "Страница" : "Səhifə",
          href: p.href,
          icon: p.icon,
          accent: "cyan",
        });
      }
    }

    return result;
  }, [query, isRu, pickLocalized]);

  // Reset active when results change
  useEffect(() => {
    setActive(0);
  }, [query]);

  const groups = useMemo(() => {
    const map: Record<Item["group"], Item[]> = {
      category: [],
      page: [],
    };
    for (const it of items) map[it.group].push(it);
    return map;
  }, [items]);

  const handleSelect = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  // Keyboard nav: arrows + Enter
  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) handleSelect(it);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl glass-strong rounded-2xl border border-border-strong shadow-[var(--sh-4)] overflow-hidden"
          >
            {/* Top aurora glow bar */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            {/* Input row */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
              <Search className="size-5 text-ink-400 shrink-0" strokeWidth={1.6} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={isRu ? "Найди вендора, категорию, услугу…" : "Vendor, kateqoriya, xidmət tap…"}
                className="flex-1 bg-transparent outline-none border-0 text-base text-ink-900 placeholder:text-ink-500"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-ink-500 px-2 py-1 rounded-md border border-border-strong bg-bg-elevated/50">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center text-ink-500 text-sm">
                  {isRu ? "Ничего не найдено" : "Heç nə tapılmadı"}
                </div>
              ) : null}

              <Group title={isRu ? "Категории" : "Kateqoriyalar"} items={groups.category} active={active} items_all={items} onSelect={handleSelect} setActive={setActive} />
              <Group title={isRu ? "Страницы" : "Səhifələr"} items={groups.page} active={active} items_all={items} onSelect={handleSelect} setActive={setActive} />
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between gap-2 px-4 h-10 border-t border-border bg-bg-elevated/40 text-[11px] text-ink-500">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <KeyHint>↑</KeyHint><KeyHint>↓</KeyHint>{isRu ? "навигация" : "naviqasiya"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <KeyHint><CornerDownLeft className="size-3" /></KeyHint>{isRu ? "открыть" : "aç"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <Command className="size-3" />
                <span className="font-mono">+ K</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Group({
  title,
  items,
  items_all,
  active,
  onSelect,
  setActive,
}: {
  title: string;
  items: Item[];
  items_all: Item[];
  active: number;
  onSelect: (i: Item) => void;
  setActive: (i: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="px-2 pb-1.5">
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest font-mono text-ink-500">
        {title}
      </div>
      <ul>
        {items.map((it) => {
          const globalIdx = items_all.findIndex((x) => x.id === it.id);
          const isActive = globalIdx === active;
          return (
            <li key={it.id}>
              <CommandRow item={it} active={isActive} onSelect={onSelect} onHover={() => setActive(globalIdx)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CommandRow({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: Item;
  active: boolean;
  onSelect: (i: Item) => void;
  onHover: () => void;
}) {
  const Icon = item.icon;
  const accentGrad: Record<Item["accent"], string> = {
    violet:  "from-violet-500 to-violet-700",
    magenta: "from-magenta-500 to-violet-700",
    cyan:    "from-cyan-500 to-violet-500",
    gold:    "from-gold-500 to-magenta-500",
  };
  return (
    <Link
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onSelect(item);
      }}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        active
          ? "bg-violet-500/15 ring-1 ring-violet-500/40"
          : "hover:bg-surface-2/60",
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg shrink-0 text-white shadow-[var(--sh-1)] bg-gradient-to-br",
          accentGrad[item.accent],
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900 truncate">{item.title}</div>
        {item.subtitle ? (
          <div className="text-xs text-ink-500 truncate">{item.subtitle}</div>
        ) : null}
      </div>
      <ArrowRight
        className={cn(
          "size-4 shrink-0 transition",
          active ? "text-violet-300 translate-x-0" : "text-ink-500 -translate-x-1 opacity-0 group-hover:opacity-100",
        )}
        strokeWidth={1.8}
      />
    </Link>
  );
}

function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 h-4 min-w-4 rounded-sm border border-border-strong bg-bg-elevated/50 font-mono text-[10px] text-ink-300">
      {children}
    </kbd>
  );
}
