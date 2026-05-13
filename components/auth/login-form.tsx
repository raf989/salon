"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Phone } from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { sendPhoneOtp, toE164 } from "@/lib/firebase";
import { OtpForm } from "@/components/auth/otp-form";

// Login is passwordless: phone → OTP. Firebase Phone Auth owns the flow.
// After OTP confirm, if a cached profile exists for the UID we route by
// role; otherwise we push to /register so the user completes their info.
const RECAPTCHA_CONTAINER_ID = "recaptcha-login";

type Stage = "phone" | "otp";

export function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const cached = useCurrentUser();

  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [phoneE164, setPhoneE164] = useState<string>("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmitPhone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const normalized = toE164(phone);
    if (!normalized) {
      setError(t("auth.register.error.invalidPhone"));
      return;
    }
    setSubmitting(true);
    try {
      const conf = await sendPhoneOtp(normalized, RECAPTCHA_CONTAINER_ID);
      setPhoneE164(normalized);
      setConfirmation(conf);
      setStage("otp");
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (
          err.code === "auth/invalid-phone-number" ||
          err.code === "auth/missing-phone-number"
        ) {
          setError(t("auth.register.error.invalidPhone"));
        } else if (err.code === "auth/too-many-requests") {
          setError(t("auth.otp.error.tooManyRequests"));
        } else if (err.code === "auth/quota-exceeded") {
          setError(t("auth.otp.error.quotaExceeded"));
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

  if (stage === "otp" && confirmation) {
    return (
      <OtpForm
        confirmation={confirmation}
        phone={phoneE164}
        onSuccess={() => {
          if (cached) {
            router.push(cached.role === "provider" ? "/dashboard" : "/");
          } else {
            router.push("/register");
          }
        }}
      />
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmitPhone} noValidate>
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
        {submitting ? t("auth.otp.sending") : t("auth.login.submit")}
      </Button>

      {/* Invisible reCAPTCHA mount. Firebase injects the widget here on
          first send; only becomes visible if Firebase challenges the user. */}
      <div id={RECAPTCHA_CONTAINER_ID} />

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
