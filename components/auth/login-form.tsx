"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = useStore.getState().login(phone, password);
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === "notFound")
        setError(t("auth.login.error.notFound"));
      else if (result.reason === "wrongPassword")
        setError(t("auth.login.error.wrongPassword"));
      else if (result.reason === "notVerified")
        setError(t("auth.login.error.notVerified"));
      return;
    }
    const user = useStore.getState().currentUser();
    router.push(user?.role === "provider" ? "/dashboard" : "/");
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div>
        <label
          htmlFor="login-phone"
          className="block text-xs font-semibold text-ink-700 mb-1.5"
        >
          {t("auth.login.phone")}
        </label>
        <Input
          id="login-phone"
          type="tel"
          autoComplete="tel"
          icon={<Phone />}
          placeholder="+994 50 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="block text-xs font-semibold text-ink-700 mb-1.5"
        >
          {t("auth.login.password")}
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          icon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error ? (
        <p className="text-xs text-danger-500" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting}
      >
        {t("auth.login.submit")}
      </Button>

      <p className="text-sm text-ink-500 text-center mt-2">
        {t("auth.login.noAccount")}{" "}
        <Link
          href="/register"
          className="text-caspian-600 font-semibold hover:underline"
        >
          {t("auth.login.signupLink")}
        </Link>
      </p>
    </form>
  );
}
