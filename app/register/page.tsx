"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";
import { RegisterForm } from "@/components/auth/register-form";
import { RegisterRolePicker } from "@/components/auth/register-role-picker";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";

type Step = "role" | "form" | "otp" | "success";

function RegisterFlow() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");

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
            className="text-caspian-600 font-semibold hover:underline"
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
          onSuccess={(id, normalizedPhone) => {
            setUserId(id);
            setPhone(normalizedPhone);
            setStep("otp");
          }}
        />
        <p className="text-sm text-ink-500 text-center mt-6">
          {t("auth.register.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-caspian-600 font-semibold hover:underline"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (step === "otp" && userId) {
    return (
      <AuthShell title={t("auth.otp.title")}>
        <OtpForm
          userId={userId}
          phone={phone}
          onSuccess={() => setStep("success")}
        />
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
          <span className="grid place-items-center size-16 rounded-full bg-success-50 text-success-500">
            <CheckCircle2 className="size-8" />
          </span>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            type="button"
            onClick={() => router.push(target)}
          >
            {buttonLabel}
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Fallback (e.g. if step/role state combination is incomplete) — show role picker.
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
      <RegisterFlow />
    </Suspense>
  );
}
