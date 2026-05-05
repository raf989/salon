"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, LayoutDashboard, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { AuthUser } from "@/lib/types";
import { cn, formatPhone } from "@/lib/utils";

type Props = { user: AuthUser };

export function UserMenu({ user }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleLogout() {
    useStore.getState().logout();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-[10px] hover:bg-ink-50 transition-colors",
          open && "bg-ink-50",
        )}
      >
        <Avatar size="sm" name={user.name} id={user.id} />
        <span className="hidden md:inline text-sm font-medium text-ink-800">
          {user.name}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-[var(--sh-3)] p-2 z-50"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-semibold text-ink-900 truncate">
              {user.name}
            </div>
            <div className="text-xs text-ink-500 truncate mt-0.5">
              {formatPhone(user.phone)}
            </div>
          </div>
          <div className="h-px bg-border my-1" />
          <MenuLink href="/" onClick={() => setOpen(false)}>
            <UserRound className="size-4" />
            {t("auth.userMenu.profile")}
          </MenuLink>
          {user.role === "provider" ? (
            <MenuLink href="/dashboard" onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" />
              {t("auth.userMenu.dashboard")}
            </MenuLink>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
          >
            <LogOut className="size-4" />
            {t("auth.userMenu.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}
