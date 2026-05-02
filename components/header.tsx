"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Kəşf et" },
  { href: "/dashboard", label: "Panel" },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);

  const onSwitchRole = (next: Role) => {
    setRole(next);
    if (next === "worker") {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Salon ana səhifə"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/25 text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)]/20">
            <Scissors className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-neutral-100">
            Salon
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors",
                  active
                    ? "text-neutral-100 bg-white/[0.06]"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-0.5">
            <RoleButton
              active={role === "client"}
              onClick={() => onSwitchRole("client")}
            >
              Müştəri
            </RoleButton>
            <RoleButton
              active={role === "worker"}
              onClick={() => onSwitchRole("worker")}
            >
              Usta
            </RoleButton>
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
        active
          ? "bg-[var(--accent)] text-neutral-950 shadow-[0_2px_12px_-2px_rgba(212,165,116,0.4)]"
          : "text-neutral-400 hover:text-neutral-100",
      )}
    >
      {children}
    </button>
  );
}
