"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { useStore } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl flex h-full items-center px-4 md:px-6 gap-3">
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

        {/* Language switcher */}
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
      </div>
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
