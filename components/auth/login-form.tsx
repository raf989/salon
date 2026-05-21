"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { signInWithPhonePassword, toE164 } from "@/lib/firebase";
import { getUserProfile } from "@/lib/api/repo";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
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
      // the registration one. A network failure throws (handled below); a
      // `null` means the account has no profile row (half-provisioned —
      // registration's profile step never completed). Don't guess a role:
      // surface a clear message rather than silently routing them to "/".
      const profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        setError(t("auth.login.error.noProfile"));
        return;
      }
      cacheProfile(profile);
      router.push(profile.role === "provider" ? "/dashboard" : "/");
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
        } else if (err.code === "auth/network-request-failed") {
          setError(t("auth.error.network"));
        } else {
          setError(t("auth.error.generic"));
        }
      } else {
        setError(t("auth.error.generic"));
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
          className="h-12 text-base"
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
        <PasswordField
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
        />
      </div>

      {error ? (
        <p className="text-xs text-danger-500" role="alert">
          {error}
        </p>
      ) : null}

      <MagneticButton
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting}
      >
        {submitting ? t("auth.otp.checking") : t("auth.login.submit")}
      </MagneticButton>

      <p className="text-sm text-ink-500 text-center mt-2">
        {t("auth.login.noAccount")}{" "}
        <Link
          href="/register"
          className="text-violet-400 font-semibold hover:text-violet-300 hover:underline transition-colors"
        >
          {t("auth.login.signupLink")}
        </Link>
      </p>
    </form>
  );
}

function PasswordField({
  id,
  autoComplete,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  id: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        icon={<Lock />}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-12 text-base pr-12")}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? "Hide password" : "Show password"}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-md text-ink-400 hover:text-ink-700 transition-colors",
          "focus:outline-none focus:text-violet-400",
        )}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
