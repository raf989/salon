"use client";

import { useState, type FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn, formatPhone } from "@/lib/utils";

// Firebase OTP confirmation. Caller passes the `ConfirmationResult`
// returned from `signInWithPhoneNumber`; on success we hand back the
// signed-in user (and the parent decides what to do — redirect, save
// profile, etc.). No mock 123456 check anymore; the code goes straight
// to Firebase.
type Props = {
  confirmation: ConfirmationResult;
  phone: string;
  // May be async — register-form links a password after OTP confirm, and
  // we want that to finish (or surface its error) before leaving this form.
  onSuccess: (uid: string) => void | Promise<void>;
};

export function OtpForm({ confirmation, phone, onSuccess }: Props) {
  const { t } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtitleTemplate = t("auth.otp.subtitle");
  const subtitle = subtitleTemplate.replace("{phone}", formatPhone(phone));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cred = await confirmation.confirm(code);
      await onSuccess(cred.user.uid);
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/invalid-verification-code") {
          setError(t("auth.otp.error.wrong"));
        } else if (err.code === "auth/code-expired") {
          setError(t("auth.otp.error.expired"));
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

  function handleChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <p className="text-sm text-ink-600 -mt-2">{subtitle}</p>

      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => handleChange(e.target.value)}
        aria-label={t("auth.otp.title")}
        className={cn(
          "h-16 w-full rounded-[12px] border border-border-strong bg-surface text-center font-mono text-3xl tracking-[0.5em] text-ink-900 transition-colors",
          "hover:border-ink-300",
          "focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)]",
          "placeholder:text-ink-300 placeholder:tracking-[0.5em]",
        )}
        placeholder="••••••"
        autoFocus
      />

      <p className="text-xs text-ink-400 text-center -mt-1">
        {t("auth.otp.hint")}
      </p>

      {error ? (
        <p className="text-xs text-danger-500 text-center" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting || code.length !== 6}
      >
        {submitting ? t("auth.otp.checking") : t("auth.otp.submit")}
      </Button>
    </form>
  );
}
