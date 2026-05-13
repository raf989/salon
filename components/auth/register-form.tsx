"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, AtSign, Phone, User as UserIcon } from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpForm } from "@/components/auth/otp-form";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { sendPhoneOtp, toE164 } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import {
  KIND_LABELS,
  type ProviderKind,
  type UserRole,
} from "@/lib/types";

type Props = {
  role: UserRole;
  onSuccess: () => void;
  onBack: () => void;
};

type FieldErrors = Partial<{
  name: string;
  phone: string;
  email: string;
  kind: string;
  form: string;
}>;

type Stage = "form" | "otp";

const RECAPTCHA_CONTAINER_ID = "recaptcha-register";

const PROVIDER_KINDS: ProviderKind[] = [
  "photographer",
  "dj",
  "restaurant",
  "host",
  "barber",
  "salon",
  "makeup",
];

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Register collects profile fields locally, then hands the phone to
// Firebase for SMS verification. Only after `confirmationResult.confirm`
// succeeds do we persist the profile — that way an abandoned form leaves
// no orphan data.
export function RegisterForm({ role, onSuccess, onBack }: Props) {
  const { t, pickLocalized } = useT();
  const setProfile = useStore((s) => s.setProfile);

  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<ProviderKind | "">("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [phoneE164, setPhoneE164] = useState<string>("");

  function validate(): { errors: FieldErrors; normalized?: string } {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = t("auth.register.error.required");
    const normalized = toE164(phone);
    if (!normalized) e.phone = t("auth.register.error.invalidPhone");
    if (role === "provider") {
      if (!EMAIL_RE.test(email))
        e.email = t("auth.register.error.invalidEmail");
      if (!kind) e.kind = t("auth.register.error.required");
    }
    return { errors: e, normalized: normalized ?? undefined };
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const { errors: eMap, normalized } = validate();
    if (Object.keys(eMap).length > 0 || !normalized) {
      setErrors(eMap);
      return;
    }
    setErrors({});
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
          setErrors({ phone: t("auth.register.error.invalidPhone") });
        } else if (err.code === "auth/too-many-requests") {
          setErrors({ form: t("auth.otp.error.tooManyRequests") });
        } else if (err.code === "auth/quota-exceeded") {
          setErrors({ form: t("auth.otp.error.quotaExceeded") });
        } else {
          setErrors({ form: err.message });
        }
      } else {
        setErrors({
          form: err instanceof Error ? err.message : String(err),
        });
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
        onSuccess={(uid) => {
          // OTP succeeded → Firebase user exists. Persist the locally
          // collected profile keyed by UID, then let the parent flow
          // advance to the success screen.
          setProfile({
            uid,
            phone: phoneE164,
            name,
            role,
            email: role === "provider" ? email : undefined,
            kind: role === "provider" ? (kind as ProviderKind) : undefined,
          });
          onSuccess();
        }}
      />
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors -mt-2 mb-1"
      >
        <ArrowLeft className="size-3.5" />
        {t("auth.register.back")}
      </button>

      <Field
        id="reg-name"
        label={t("auth.register.field.name")}
        error={errors.name}
      >
        <Input
          id="reg-name"
          type="text"
          autoComplete="name"
          icon={<UserIcon />}
          placeholder={t("auth.register.field.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field
        id="reg-phone"
        label={t("auth.register.field.phone")}
        error={errors.phone}
      >
        <Input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          icon={<Phone />}
          placeholder={t("auth.register.field.phonePlaceholder")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>

      {role === "provider" ? (
        <>
          <Field
            id="reg-email"
            label={t("auth.register.field.email")}
            error={errors.email}
          >
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              icon={<AtSign />}
              placeholder={t("auth.register.field.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field
            id="reg-kind"
            label={t("auth.register.field.profession")}
            error={errors.kind}
          >
            <select
              id="reg-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ProviderKind | "")}
              className={cn(
                "h-11 w-full rounded-[10px] border border-border-strong bg-surface px-4 text-sm text-ink-800 transition-colors",
                "hover:border-ink-300",
                "focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)]",
                kind === "" && "text-ink-400",
              )}
            >
              <option value="" disabled>
                {t("auth.register.field.professionPlaceholder")}
              </option>
              {PROVIDER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {pickLocalized(KIND_LABELS[k])}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}

      {errors.form ? (
        <p className="text-xs text-danger-500" role="alert">
          {errors.form}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting}
      >
        {submitting ? t("auth.otp.sending") : t("auth.register.submit")}
      </Button>

      {/* Invisible reCAPTCHA mount — same pattern as login-form. */}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-ink-700 mb-1.5"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger-500 mt-1.5" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
