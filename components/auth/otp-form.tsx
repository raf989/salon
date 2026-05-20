"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import type { ConfirmationResult } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { MagneticButton } from "@/components/ui/magnetic-button";
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

const RESEND_SECONDS = 30;

export function OtpForm({ confirmation, phone, onSuccess }: Props) {
  const { t, pickLocalized } = useT();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [remaining]);

  const subtitleTemplate = t("auth.otp.subtitle");
  const subtitle = subtitleTemplate.replace("{phone}", formatPhone(phone));
  const code = digits.join("");

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

  function setDigit(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    // Allow pasting / multi-character entry: distribute across cells.
    const next = [...digits];
    let cursor = index;
    for (const ch of cleaned) {
      if (cursor > 5) break;
      next[cursor] = ch;
      cursor += 1;
    }
    setDigits(next);
    const nextIndex = Math.min(cursor, 5);
    inputsRef.current[nextIndex]?.focus();
    if (error) setError(null);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < txt.length; i++) next[i] = txt[i] ?? "";
    setDigits(next);
    inputsRef.current[Math.min(txt.length, 5)]?.focus();
    if (error) setError(null);
  }

  const resendInLabel = pickLocalized({
    az: `Yenidən göndər ({s}s)`,
    ru: `Отправить снова ({s}с)`,
  }).replace("{s}", String(remaining));
  const resendNowLabel = pickLocalized({
    az: "Yenidən göndər",
    ru: "Отправить снова",
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <p className="text-sm text-ink-500 -mt-2">{subtitle}</p>

      <div className="flex items-center justify-center gap-2 sm:gap-2.5">
        {digits.map((d, i) => {
          const filled = d !== "";
          const active = code.length === i;
          return (
            <motion.div
              key={i}
              className="relative"
              animate={
                active && !filled
                  ? { scale: [1, 1.04, 1] }
                  : { scale: 1 }
              }
              transition={
                active && !filled
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              <input
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                pattern="\d*"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={`${t("auth.otp.title")} ${i + 1}`}
                className={cn(
                  "h-14 w-11 sm:w-12 text-center font-mono text-2xl rounded-xl border border-border-strong glass-strong",
                  "transition-all duration-200 outline-none",
                  "focus:border-violet-500 focus:shadow-[var(--sh-glow-violet)]",
                  filled
                    ? "text-ink-900 border-magenta-500/60 shadow-[var(--sh-glow-magenta)]"
                    : "text-ink-900",
                )}
                autoFocus={i === 0}
              />
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-ink-500 text-center -mt-1">
        {t("auth.otp.hint")}
      </p>

      {error ? (
        <p className="text-xs text-danger-500 text-center" role="alert">
          {error}
        </p>
      ) : null}

      <MagneticButton
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting || code.length !== 6}
      >
        {submitting ? t("auth.otp.checking") : t("auth.otp.submit")}
      </MagneticButton>

      <div className="flex items-center justify-center">
        {remaining > 0 ? (
          <div className="inline-flex items-center gap-2 text-xs text-ink-500">
            <span
              aria-hidden
              className="relative grid place-items-center size-5"
            >
              <svg viewBox="0 0 24 24" className="size-5">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="var(--violet-500, #9B6CF6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 10}
                  strokeDashoffset={
                    2 * Math.PI * 10 * (1 - remaining / RESEND_SECONDS)
                  }
                  transform="rotate(-90 12 12)"
                  transition={{ duration: 0.4, ease: "linear" }}
                />
              </svg>
            </span>
            <span>{resendInLabel}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRemaining(RESEND_SECONDS)}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            {resendNowLabel}
          </button>
        )}
      </div>
    </form>
  );
}
