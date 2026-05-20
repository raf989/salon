"use client";

import { motion } from "framer-motion";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useT();
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <AuthShell
        title={t("auth.login.title")}
        subtitle={t("auth.login.subtitle")}
      >
        <LoginForm />
      </AuthShell>
    </motion.main>
  );
}
