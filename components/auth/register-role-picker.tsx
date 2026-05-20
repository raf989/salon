"use client";

import { Briefcase, User } from "lucide-react";
import type { ReactNode } from "react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { TiltCard } from "@/components/ui/tilt-card";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type Props = {
  value: UserRole | null;
  onChange: (r: UserRole) => void;
  onContinue: () => void;
};

export function RegisterRolePicker({ value, onChange, onContinue }: Props) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <RoleCard
          selected={value === "client"}
          onClick={() => onChange("client")}
          tone="violet"
          icon={<User />}
          title={t("auth.register.role.client.title")}
          description={t("auth.register.role.client.desc")}
        />
        <RoleCard
          selected={value === "provider"}
          onClick={() => onChange("provider")}
          tone="magenta"
          icon={<Briefcase />}
          title={t("auth.register.role.provider.title")}
          description={t("auth.register.role.provider.desc")}
        />
      </div>
      <MagneticButton
        variant="primary"
        size="lg"
        className="w-full"
        type="button"
        disabled={!value}
        onClick={onContinue}
      >
        {t("auth.register.role.continue")}
      </MagneticButton>
    </div>
  );
}

function RoleCard({
  selected,
  onClick,
  tone,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  tone: "violet" | "magenta";
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const accent =
    tone === "violet"
      ? {
          iconBg: "bg-gradient-to-br from-violet-500 to-violet-700",
          iconGlow: "shadow-[var(--sh-glow-violet)]",
        }
      : {
          iconBg: "bg-gradient-to-br from-magenta-500 to-magenta-700",
          iconGlow: "shadow-[var(--sh-glow-magenta)]",
        };
  return (
    <TiltCard max={6} scale={selected ? 1.03 : 1.02} glare>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "relative w-full text-left rounded-2xl p-5 flex flex-col gap-3.5 glass-strong",
          "transition-all duration-300 focus:outline-none",
          "border",
          selected
            ? "border-violet-500 shadow-[var(--sh-glow-violet)] scale-[1.02]"
            : "border-border-strong hover:border-violet-500/40",
        )}
      >
        <span
          className={cn(
            "grid place-items-center size-12 rounded-xl text-white [&_svg]:size-5 transition-all",
            accent.iconBg,
            selected ? accent.iconGlow : "",
          )}
        >
          {icon}
        </span>
        <div>
          <div className="font-display font-semibold text-lg text-ink-900 leading-tight">
            {title}
          </div>
          <div className="text-sm text-ink-500 mt-1 leading-relaxed">
            {description}
          </div>
        </div>
        {selected ? (
          <span
            aria-hidden
            className="absolute top-3 right-3 grid place-items-center size-5 rounded-full bg-violet-500 text-white text-[10px] font-bold shadow-[var(--sh-glow-violet)]"
          >
            ✓
          </span>
        ) : null}
      </button>
    </TiltCard>
  );
}
