"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User as UserIcon,
} from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ConfettiBurst, useConfetti } from "@/components/ui/confetti-burst";
import { useToast } from "@/components/ui/toast";
import { OtpForm } from "@/components/auth/otp-form";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  linkPasswordToCurrentUser,
  sendPhoneOtp,
  toE164,
} from "@/lib/firebase";
import { signOut } from "@/lib/auth";
import { createProvider, createUserProfile } from "@/lib/api/repo";
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
  password: string;
  passwordConfirm: string;
  email: string;
  kind: string;
  form: string;
}>;

type Stage = "form" | "otp";

const RECAPTCHA_CONTAINER_ID = "recaptcha-register";
const MIN_PASSWORD_LENGTH = 6;

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

// 0 = empty, 1 = weak, 2 = medium, 3 = strong
function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/\d/.test(pw) && /[A-Za-z]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  if (score >= 1) return 1;
  return 0;
}

// Register collects profile fields + a password locally, then verifies the
// phone via Firebase OTP. After OTP confirm we link an Email/Password
// credential (synthetic email derived from the phone) so the user can log
// in later with phone+password and no SMS. The password never touches
// state until OTP succeeds — an abandoned form leaves no Firebase account
// with a dangling password.
export function RegisterForm({ role, onSuccess, onBack }: Props) {
  const { t, pickLocalized } = useT();
  const setProfile = useStore((s) => s.setProfile);
  const { toast } = useToast();
  const [fireConfetti, confettiProps] = useConfetti();

  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<ProviderKind | "">("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [phoneE164, setPhoneE164] = useState<string>("");

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = useMemo(() => {
    if (strength === 0) return "";
    if (strength === 1)
      return pickLocalized({ az: "Zəif", ru: "Слабый" });
    if (strength === 2)
      return pickLocalized({ az: "Orta", ru: "Средний" });
    return pickLocalized({ az: "Güclü", ru: "Сильный" });
  }, [strength, pickLocalized]);

  function validate(): { errors: FieldErrors; normalized?: string } {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = t("auth.register.error.required");
    const normalized = toE164(phone);
    if (!normalized) e.phone = t("auth.register.error.invalidPhone");
    if (password.length < MIN_PASSWORD_LENGTH) {
      e.password = t("auth.register.error.passwordShort");
    }
    if (passwordConfirm !== password) {
      e.passwordConfirm = t("auth.register.error.passwordMismatch");
    }
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
        } else if (err.code === "auth/network-request-failed") {
          setErrors({ form: t("auth.error.network") });
        } else {
          setErrors({ form: t("auth.error.generic") });
        }
      } else {
        setErrors({ form: t("auth.error.generic") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Re-send the SMS and swap in the fresh ConfirmationResult so the next
  // code entry validates against the new code. Errors propagate to OtpForm.
  async function handleResend(): Promise<void> {
    const conf = await sendPhoneOtp(phoneE164, RECAPTCHA_CONTAINER_ID);
    setConfirmation(conf);
  }

  function celebrateSuccess() {
    // Fire confetti + success toast + onboarding-tour flag, then bubble
    // the success up so the parent flow advances. The toast and confetti
    // are best-effort: even if a provider is missing, this never throws.
    if (role === "provider") {
      // The post-register tour only exists on the provider dashboard —
      // setting the flag for a client just leaves stale sessionStorage.
      try {
        sessionStorage.setItem("vaxt:show-onboarding-tour", "1");
      } catch {
        // sessionStorage can be unavailable in private modes; ignore.
      }
    }
    fireConfetti();
    toast({
      title: pickLocalized({
        az: "Hesabın hazırdır!",
        ru: "Аккаунт готов!",
      }),
      description: pickLocalized({
        az: "BRONELE-yə xoş gəlmisən.",
        ru: "Добро пожаловать в BRONELE.",
      }),
      variant: "success",
    });
    onSuccess();
  }

  if (stage === "otp" && confirmation) {
    return (
      <>
        <ConfettiBurst {...confettiProps} />
        <OtpForm
          confirmation={confirmation}
          phone={phoneE164}
          onResend={handleResend}
          onSuccess={async (uid) => {
            // OTP succeeded → Firebase user exists. Link the password so
            // future logins are phone+password (no SMS). If the credential
            // is already linked (rare re-run), treat it as already-set
            // rather than fatal — the account is still usable.
            try {
              await linkPasswordToCurrentUser(phoneE164, password);
            } catch (err) {
              if (
                err instanceof FirebaseError &&
                (err.code === "auth/provider-already-linked" ||
                  err.code === "auth/email-already-in-use" ||
                  err.code === "auth/credential-already-in-use")
              ) {
                // Password was already set on a prior attempt — fine.
              } else {
                // The phone account now exists but has no password — staying
                // signed in here would lock the user out of phone+password
                // login. Sign out so a retry (same phone → same UID) starts
                // clean and can re-link the credential.
                await signOut();
                throw new Error(t("auth.register.error.linkFailed"));
              }
            }
            // Persist the profile server-side so it's recoverable on any
            // device. For providers also create the `providers` business
            // row so the dashboard can resolve "me" by auth_user_id.
            //
            // Both calls are idempotent (users uses upsert; createProvider
            // checks for an existing row first), so a network blip → retry
            // recovers cleanly. Map raw errors to a friendlier message
            // ending in "повторите попытку" so the user knows to retry.
            try {
              await createUserProfile({
                uid,
                name,
                phone: phoneE164,
                role,
                email: role === "provider" ? email : undefined,
                kind:
                  role === "provider" ? (kind as ProviderKind) : undefined,
              });
              if (role === "provider") {
                await createProvider({
                  authUserId: uid,
                  name,
                  kind: kind as ProviderKind,
                });
              }
              // Local cache for instant paint before FirebaseAuthSync's fetch.
              setProfile({
                uid,
                phone: phoneE164,
                name,
                role,
                email: role === "provider" ? email : undefined,
                kind:
                  role === "provider" ? (kind as ProviderKind) : undefined,
              });
              celebrateSuccess();
            } catch (err) {
              // Friendly wrapper: a raw Supabase / network error here ends
              // up in OtpForm's error banner verbatim. Re-throwing as a
              // localized message keeps the original via `cause` for the
              // console while showing the user something actionable.
              const wrapped = new Error(
                t("auth.register.error.profileSetupFailed"),
              );
              (wrapped as Error & { cause?: unknown }).cause = err;
              throw wrapped;
            }
          }}
        />
        {/* reCAPTCHA must stay mounted in the OTP stage too so "resend"
            can build a fresh verifier (Firebase binds it to this node). */}
        <div id={RECAPTCHA_CONTAINER_ID} />
      </>
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
          className="h-12 text-base"
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
          className="h-12 text-base"
        />
      </Field>

      <Field
        id="reg-password"
        label={t("auth.register.field.password")}
        error={errors.password}
      >
        <PasswordField
          id="reg-password"
          autoComplete="new-password"
          placeholder={t("auth.register.field.passwordPlaceholder")}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
        />
        <StrengthMeter strength={strength} label={strengthLabel} />
      </Field>

      <Field
        id="reg-password-confirm"
        label={t("auth.register.field.passwordConfirm")}
        error={errors.passwordConfirm}
      >
        <PasswordField
          id="reg-password-confirm"
          autoComplete="new-password"
          placeholder={t("auth.register.field.passwordConfirmPlaceholder")}
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          show={showPasswordConfirm}
          onToggleShow={() => setShowPasswordConfirm((v) => !v)}
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
              className="h-12 text-base"
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
                "h-12 w-full rounded-[10px] border border-border-strong bg-surface/60 backdrop-blur-sm px-4 text-base text-ink-800 transition-all",
                "hover:border-border-strong",
                "focus:outline-none focus:border-violet-500 focus:shadow-[var(--sh-focus)]",
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

      <MagneticButton
        variant="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitting}
      >
        {submitting ? t("auth.otp.sending") : t("auth.register.submit")}
      </MagneticButton>

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
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-base pr-12"
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

function StrengthMeter({
  strength,
  label,
}: {
  strength: 0 | 1 | 2 | 3;
  label: string;
}) {
  const colors = [
    "bg-magenta-500 shadow-[var(--sh-glow-magenta)]",
    "bg-violet-500 shadow-[var(--sh-glow-violet)]",
    "bg-cyan-500 shadow-[var(--sh-glow-cyan)]",
  ];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < strength
                ? colors[Math.min(strength - 1, 2)]
                : "bg-border-strong/60",
            )}
          />
        ))}
      </div>
      {label ? (
        <span className="text-[11px] font-medium text-ink-500 min-w-[40px] text-right">
          {label}
        </span>
      ) : null}
    </div>
  );
}
