"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { UserMenu } from "@/components/auth/user-menu";
import { useStore } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import type { AuthUser, Lang } from "@/lib/types";
import { cn, formatPhone } from "@/lib/utils";
import { useProviders } from "@/lib/api/repo";

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
];

export function Header() {
  const pathname = usePathname();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const currentUser = useStore(
    (s) => s.users.find((u) => u.id === s.sessionUserId) ?? null,
  );
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
  // spurious listeners on every render).
  const menuWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    function onPointerDown(e: MouseEvent) {
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
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={menuWrapRef}
      className="sticky top-0 z-40 w-full border-b border-border bg-surface"
    >
      <div className="mx-auto max-w-7xl flex h-16 items-center px-4 md:px-6 gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          aria-label={t("brand.homeAria")}
        >
          <span className="grid size-7 place-items-center rounded-[8px] bg-caspian-500 text-white font-display text-[14px] font-semibold">
            V
          </span>
          <span className="font-display font-semibold text-xl text-ink-900 tracking-tight">
            {t("brand.name")}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-[8px] text-sm font-medium transition-colors",
                  active
                    ? "bg-ink-50 text-ink-900"
                    : "text-ink-600 hover:text-ink-900 hover:bg-ink-50",
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Language switcher — visible on every viewport, mirroring the
            requirement that the mobile panel doesn't need its own copy. */}
        <div
          className="flex items-center bg-ink-50 rounded-[10px] p-1"
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
            "md:hidden inline-flex items-center justify-center size-9 rounded-[10px] text-ink-700 hover:bg-ink-50 transition-colors",
            mobileOpen && "bg-ink-50",
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
          className="md:hidden border-t border-border bg-surface"
        >
          <nav className="mx-auto max-w-7xl flex flex-col px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-3 py-3 rounded-[8px] text-base font-medium transition-colors",
                    active
                      ? "bg-ink-50 text-ink-900"
                      : "text-ink-700 hover:text-ink-900 hover:bg-ink-50",
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
        "h-7 px-2.5 text-xs font-semibold uppercase tracking-wider rounded-[8px] transition-colors",
        active
          ? "bg-surface text-ink-900 shadow-[var(--sh-1)]"
          : "text-ink-500 hover:text-ink-800",
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
  // Show the same phone-resolution rule as UserMenu so the mobile panel
  // doesn't disagree with the desktop dropdown.
  const providers = useProviders();
  const meProvider = providers[0];
  const primaryPhone = meProvider?.phones?.[0] ?? user.phone ?? "";

  function handleLogout() {
    useStore.getState().logout();
    onClose();
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar size="sm" name={user.name} id={user.id} />
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
          className="flex items-center gap-2 px-3 py-3 text-sm text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
        >
          <LayoutDashboard className="size-4" />
          {t("auth.userMenu.dashboard")}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-3 text-sm text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
      >
        <LogOut className="size-4" />
        {t("auth.userMenu.logout")}
      </button>
    </div>
  );
}
