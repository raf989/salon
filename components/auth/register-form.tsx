"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, AtSign, Lock, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn, normalizePhone } from "@/lib/utils";
import {
  KIND_LABELS,
  type ProviderKind,
  type UserRole,
} from "@/lib/types";

type Props = {
  role: UserRole;
  onSuccess: (userId: string, phone: string) => void;
  onBack: () => void;
};

type FieldErrors = Partial<{
  name: string;
  phone: string;
  password: string;
  email: string;
  kind: string;
  form: string;
}>;

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

export function RegisterForm({ role, onSuccess, onBack }: Props) {
  const { t, pickLocalized } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<ProviderKind | "">("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = t("auth.register.error.required");
    if (!normalizePhone(phone))
      e.phone = t("auth.register.error.invalidPhone");
    if (password.length < 6)
      e.password = t("auth.register.error.passwordShort");
    if (role === "provider") {
      if (!EMAIL_RE.test(email))
        e.email = t("auth.register.error.invalidEmail");
      if (!kind) e.kind = t("auth.register.error.required");
    }
    return e;
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length > 0) {
      setErrors(eMap);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const result = useStore.getState().register({
      phone,
      name,
      password,
      role,
      email: role === "provider" ? email : undefined,
      kind: role === "provider" ? (kind as ProviderKind) : undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === "phoneTaken") {
        setErrors({ phone: t("auth.register.error.phoneTaken") });
      } else {
        setErrors({ phone: t("auth.register.error.invalidPhone") });
      }
      return;
    }
    const normalized = normalizePhone(phone);
    onSuccess(result.userId, normalized ?? phone);
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

      <Field
        id="reg-password"
        label={t("auth.register.field.password")}
        error={errors.password}
      >
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          icon={<Lock />}
          placeholder={t("auth.register.field.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {t("auth.register.submit")}
      </Button>
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
