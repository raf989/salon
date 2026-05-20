"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { useCurrentUser, useStore } from "@/lib/store";
import { signOut } from "@/lib/auth";
import { useT, type DictKey } from "@/lib/i18n";
import type { AuthUser, Lang } from "@/lib/types";
import { cn, formatPhone } from "@/lib/utils";
import { useProviderByAuthUserId } from "@/lib/api/repo";

type NavItem = {
  href: string;
  labelKey: DictKey;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.catalog",
    match: (p) => p === "/",
  },
  {
    href: "/tenders",
    labelKey: "nav.tenders",
    match: (p) => p.startsWith("/tenders"),
  },
  {
    href: "/favorites",
    labelKey: "nav.favorites",
    match: (p) => p.startsWith("/favorites"),
  },
  {
    href: "/my-bids",
    labelKey: "nav.myBids",
    match: (p) => p.startsWith("/my-bids"),
  },
];

export function Header() {
  const pathname = usePathname();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const currentUser = useCurrentUser();
  const { t } = useT();

  // Avoid SSR/CSR mismatch: persisted auth state hydrates only on the client.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const user = hydrated ? currentUser : null;

  // Mobile menu open state — collapse on route change so navigating away
  // doesn't leave the panel covering the destination page.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Outside-click + Escape to close (only attached while open to avoid
  // spurious listeners on every render). We listen on `click` rather than
  // `mousedown` / `pointerdown` so that a tap on a `<Link>` inside the
  // menu has time to deliver its click event before the outside-handler
  // closes the panel; on inertial-scroll touch devices `mousedown`
  // sometimes fired before the synthesised click could navigate.
  const menuWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    function onClick(e: MouseEvent) {
      if (
        menuWrapRef.current &&
        !menuWrapRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={menuWrapRef}
      className="sticky top-0 z-40 w-full border-b border-border glass-strong"
    >
      <div className="mx-auto max-w-7xl flex h-16 items-center px-4 md:px-6 gap-3">
        <Link
          href="/"
          className="group shrink-0 transition-transform hover:scale-[1.03]"
          aria-label={t("brand.homeAria")}
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_ITEMS.map((item) => {
            // Gate the active highlight on `hydrated` — `usePathname()` is
            // reliable post-mount but can disagree with the prerendered
            // HTML for static pages, causing a hydration mismatch on the
            // `className` attribute of this <a>. Rendering "inactive" on
            // SSR and on the first client paint matches; the effect then
            // flips the active link in for the real navigation state.
            const active = hydrated && item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group px-3 py-2 rounded-[8px] text-sm font-medium transition-colors",
                  active
                    ? "text-ink-900"
                    : "text-ink-400 hover:text-ink-900",
                )}
              >
                <span className="relative z-10">{t(item.labelKey)}</span>
                <motion.span
                  className="pointer-events-none absolute left-2 right-2 bottom-1 h-px bg-gradient-to-r from-magenta-500 via-violet-500 to-cyan-500 origin-left"
                  initial={false}
                  animate={{ scaleX: active ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Language switcher — visible on every viewport, mirroring the
            requirement that the mobile panel doesn't need its own copy. */}
        <div
          className="flex items-center bg-surface-2/60 backdrop-blur-sm border border-border rounded-[10px] p-1"
          role="group"
          aria-label="Language"
        >
          <LangButton
            active={language === "az"}
            onClick={() => setLanguage("az")}
            code="az"
          >
            AZ
          </LangButton>
          <LangButton
            active={language === "ru"}
            onClick={() => setLanguage("ru")}
            code="ru"
          >
            RU
          </LangButton>
        </div>

        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("vaxt:open-command-palette"))
          }
          aria-label="Open command palette"
          className="hidden md:inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border-strong bg-surface-2/50 hover:bg-surface-2 hover:border-violet-500/50 transition-colors text-ink-500 hover:text-ink-200"
        >
          <Search className="size-3.5" strokeWidth={1.8} />
          <span className="text-xs">Search</span>
          <kbd className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md border border-border bg-bg-elevated/40 text-[10px] font-mono">
            ⌘ K
          </kbd>
        </button>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  {t("auth.register.title")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — visible only on <md. Mirrors `hidden md:flex` on the
            adjacent nav/auth blocks. */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={
            mobileOpen
              ? language === "ru"
                ? "Закрыть меню"
                : "Menyunu bağla"
              : language === "ru"
                ? "Открыть меню"
                : "Menyunu aç"
          }
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-panel"
          className={cn(
            "md:hidden inline-flex items-center justify-center size-9 rounded-[10px] text-ink-400 hover:text-ink-900 hover:bg-surface-2 border border-transparent transition-colors",
            mobileOpen && "bg-surface-2 border-border text-ink-900",
          )}
        >
          {mobileOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {/* Mobile dropdown panel. Full-width, slides under the header. Hidden
          at md+ where the regular inline nav takes over. */}
      {mobileOpen ? (
        <div
          id="mobile-nav-panel"
          className="md:hidden border-t border-border glass-strong"
        >
          <nav className="mx-auto max-w-7xl flex flex-col px-4 py-3">
            {NAV_ITEMS.map((item) => {
              // Same hydration guard as the desktop nav above.
              const active = hydrated && item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-3 py-3 rounded-[8px] text-base font-medium transition-colors",
                    active
                      ? "bg-surface-2 text-ink-900 border border-border-strong"
                      : "text-ink-400 hover:text-ink-900 hover:bg-surface-2",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}

            <div className="my-2 h-px bg-border" />

            {user ? (
              <MobileAuthSection
                user={user}
                onClose={() => setMobileOpen(false)}
              />
            ) : (
              <MobileGuestSection onClose={() => setMobileOpen(false)} />
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function LangButton({
  active,
  onClick,
  code,
  children,
}: {
  active: boolean;
  onClick: () => void;
  code: Lang;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={code.toUpperCase()}
      className={cn(
        "h-7 px-2.5 text-xs font-semibold uppercase tracking-wider rounded-[8px] transition-all",
        active
          ? "bg-gradient-to-br from-violet-500 to-magenta-500 text-white shadow-[var(--sh-1)]"
          : "text-ink-500 hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function MobileGuestSection({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
      <Link href="/login" onClick={onClose} className="w-full">
        <Button variant="ghost" size="md" className="w-full justify-center">
          {t("nav.login")}
        </Button>
      </Link>
      <Link href="/register" onClick={onClose} className="w-full">
        <Button variant="primary" size="md" className="w-full justify-center">
          {t("auth.register.title")}
        </Button>
      </Link>
    </div>
  );
}

function MobileAuthSection({
  user,
  onClose,
}: {
  user: AuthUser;
  onClose: () => void;
}) {
  const { t } = useT();
  // Resolve THIS user's provider row by Firebase UID — not the seed-era
  // `useProviders()[0]` hack, which showed whoever sorts first.
  const { provider: meProvider } = useProviderByAuthUserId(user.id);
  const primaryPhone = meProvider?.phones?.[0] ?? user.phone ?? "";

  function handleLogout() {
    void signOut();
    onClose();
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar
          size="sm"
          name={user.name}
          id={user.id}
          imageUrl={meProvider?.avatar}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-900 truncate">
            {user.name}
          </div>
          {primaryPhone ? (
            <div className="text-xs text-ink-500 truncate mt-0.5">
              {formatPhone(primaryPhone)}
            </div>
          ) : null}
        </div>
      </div>
      {user.role === "provider" ? (
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-3 text-sm text-ink-400 hover:text-ink-900 hover:bg-surface-2 rounded-md transition-colors"
        >
          <LayoutDashboard className="size-4" />
          {t("auth.userMenu.dashboard")}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-3 text-sm text-ink-400 hover:text-ink-900 hover:bg-surface-2 rounded-md transition-colors"
      >
        <LogOut className="size-4" />
        {t("auth.userMenu.logout")}
      </button>
    </div>
  );
}
