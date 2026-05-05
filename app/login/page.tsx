"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useT();
  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
    >
      <LoginForm />
    </AuthShell>
  );
}
