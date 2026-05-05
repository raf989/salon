"use client";

import { Briefcase, User } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RoleCard
          selected={value === "client"}
          onClick={() => onChange("client")}
          tone="caspian"
          icon={<User />}
          title={t("auth.register.role.client.title")}
          description={t("auth.register.role.client.desc")}
        />
        <RoleCard
          selected={value === "provider"}
          onClick={() => onChange("provider")}
          tone="saffron"
          icon={<Briefcase />}
          title={t("auth.register.role.provider.title")}
          description={t("auth.register.role.provider.desc")}
        />
      </div>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        type="button"
        disabled={!value}
        onClick={onContinue}
      >
        {t("auth.register.role.continue")}
      </Button>
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
  tone: "caspian" | "saffron";
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "text-left rounded-xl border p-4 transition-colors flex flex-col gap-3",
        selected
          ? "border-caspian-500 bg-caspian-50/50"
          : "border-border hover:border-ink-300",
      )}
    >
      <span
        className={cn(
          "grid place-items-center size-10 rounded-[10px] [&_svg]:size-5",
          tone === "caspian"
            ? "bg-caspian-50 text-caspian-600"
            : "bg-saffron-200/60 text-saffron-600",
        )}
      >
        {icon}
      </span>
      <div>
        <div className="font-display font-semibold text-lg text-ink-900 leading-tight">
          {title}
        </div>
        <div className="text-sm text-ink-500 mt-1">{description}</div>
      </div>
    </button>
  );
}
