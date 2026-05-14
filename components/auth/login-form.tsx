"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock, Phone } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { signInWithPhonePassword, toE164 } from "@/lib/firebase";
import { getUserProfile } from "@/lib/api/repo";

// Login is phone + password — no SMS. The password was linked to the
// Firebase account at registration time (see register-form +
// lib/firebase.ts:linkPasswordToCurrentUser). `signInWithPhonePassword`
// resolves the phone to its synthetic email and signs in with the
// Email/Password provider, returning the same UID phone auth created.
export function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const cacheProfile = useStore((s) => s.cacheProfile);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const normalized = toE164(phone);
    if (!normalized) {
      setError(t("auth.login.error.invalidPhone"));
      return;
    }
    setSubmitting(true);
    try {
      const cred = await signInWithPhonePassword(normalized, password);
      // Fetch the profile from the server — works on any device, not just
      // the registration one. Cache it so the rest of the app
      // (`useCurrentUser()`, header) sees it immediately, then route by role.
      const profile = await getUserProfile(cred.user.uid);
      if (profile) cacheProfile(profile);
      router.push(profile?.role === "provider" ? "/dashboard" : "/");
    } catch (err) {
      if (err instanceof FirebaseError) {
        // Firebase collapses "user not found" and "wrong password" into
        // auth/invalid-credential on recent SDKs — one friendly message
        // covers both and avoids leaking which part was wrong.
        if (
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
        ) {
          setError(t("auth.login.error.invalidCredential"));
        } else if (err.code === "auth/too-many-requests") {
          setError(t("auth.otp.error.tooManyRequests"));
        } else if (err.code === "auth/user-disabled") {
          setError(t("auth.login.error.notVerified"));
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSubmitting(false);
    }
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
        {submitting ? t("auth.otp.checking") : t("auth.login.submit")}
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
