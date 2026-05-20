"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { RegisterRolePicker } from "@/components/auth/register-role-picker";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useT } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";

// Stages collapsed from 4 to 3 — phone OTP is now nested inside
// RegisterForm (it owns its own confirmation result), so the parent
// only steers role → form → success.
type Step = "role" | "form" | "success";

function RegisterFlow() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Pre-select role from URL once on mount.
  useEffect(() => {
    if (initialType === "provider" || initialType === "client") {
      setSelectedRole(initialType);
      setStep("form");
    }
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (step === "role") {
    return (
      <AuthShell
        title={t("auth.register.role.title")}
        subtitle={t("auth.register.role.subtitle")}
      >
        <RegisterRolePicker
          value={selectedRole}
          onChange={setSelectedRole}
          onContinue={() => {
            if (selectedRole) setStep("form");
          }}
        />
        <p className="text-sm text-ink-500 text-center mt-6">
          {t("auth.register.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-violet-400 font-semibold hover:text-violet-300 hover:underline transition-colors"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (step === "form" && selectedRole) {
    return (
      <AuthShell
        title={t("auth.register.title")}
        subtitle={t("auth.register.subtitle")}
      >
        <RegisterForm
          role={selectedRole}
          onBack={() => setStep("role")}
          onSuccess={() => setStep("success")}
        />
        <p className="text-sm text-ink-500 text-center mt-6">
          {t("auth.register.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-violet-400 font-semibold hover:text-violet-300 hover:underline transition-colors"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (step === "success" && selectedRole) {
    const isProvider = selectedRole === "provider";
    const subtitle = isProvider
      ? t("auth.success.subtitle.provider")
      : t("auth.success.subtitle.client");
    const buttonLabel = isProvider
      ? t("auth.success.continue.provider")
      : t("auth.success.continue.client");
    const target = isProvider ? "/dashboard" : "/";

    return (
      <AuthShell title={t("auth.success.title")} subtitle={subtitle}>
        <div className="flex flex-col items-center gap-5 py-2">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid place-items-center size-16 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-[var(--sh-glow-cyan)]"
          >
            <CheckCircle2 className="size-8" />
          </motion.span>
          <MagneticButton
            variant="primary"
            size="lg"
            className="w-full"
            type="button"
            onClick={() => router.push(target)}
          >
            {buttonLabel}
          </MagneticButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.register.role.title")}
      subtitle={t("auth.register.role.subtitle")}
    >
      <RegisterRolePicker
        value={selectedRole}
        onChange={setSelectedRole}
        onContinue={() => {
          if (selectedRole) setStep("form");
        }}
      />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <RegisterFlow />
      </motion.main>
    </Suspense>
  );
}
