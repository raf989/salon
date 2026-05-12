"use client";

import { Fragment, useRef, useState, type SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  MessageCircle,
  Minus,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Crumbs } from "@/components/ui/crumbs";
import { GalleryUploader } from "@/components/dashboard/gallery-uploader";
import { TelegramIcon as SharedTelegramIcon } from "@/components/ui/social-icons";
import { updateProvider, useProvider, useProviders } from "@/lib/api/repo";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Stylist } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_PHONES = 3;

// ─── phone-masking helpers ─────────────────────────────────────────────
// AZ local part = 9 digits, displayed as "xx-xxx-xx-xx".

function formatPhoneLocal(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 7);
  const d = digits.slice(7, 9);
  let out = a;
  if (b) out += "-" + b;
  if (c) out += "-" + c;
  if (d) out += "-" + d;
  return out;
}

function stripCountryCodeAndFormat(p: string | undefined): string {
  if (!p) return "";
  return formatPhoneLocal(p.replace(/^\+?994\s*/, ""));
}

function composeE164(local: string): string | null {
  const formatted = formatPhoneLocal(local);
  return formatted ? `+994 ${formatted}` : null;
}

// ───────────────────────────────────────────────────────────────────────
// Outer wrapper waits for provider data. The inner editor receives a
// non-null `me` so all useState initializers see the real values on first
// render — fixes the "fields are empty on edit page" bug.
// ───────────────────────────────────────────────────────────────────────
export default function DashboardProfilePage() {
  const providers = useProviders();
  const meId = providers[0]?.id;
  const me = useProvider(meId);

  if (!me) return null;
  return <ProfileEditor key={me.id} me={me} />;
}

function ProfileEditor({ me }: { me: Stylist }) {
  const { t, lang } = useT();
  const router = useRouter();

  // The greeting on the dashboard reads from the authenticated user, so the
  // edit form pre-fills the same source. Falls back to the provider record
  // only if there is no logged-in user yet (and never to the seeded "Elvin").
  const authUser = useStore((s) =>
    s.users.find((u) => u.id === s.sessionUserId) ?? null,
  );
  const updateCurrentUser = useStore((s) => s.updateCurrentUser);
  const initialName = authUser?.name?.trim() ?? "";
  const [name, setName] = useState<string>(initialName);
  const [bioAz, setBioAz] = useState<string>(me.bio?.az ?? "");
  const [bioRu, setBioRu] = useState<string>(me.bio?.ru ?? "");
  const [years, setYears] = useState<string>(
    me.experienceYears !== undefined ? String(me.experienceYears) : "",
  );
  const [gallery, setGallery] = useState<string[]>(me.gallery ?? []);
  const [avatar, setAvatar] = useState<string | undefined>(me.avatar);

  // Phones — local parts only, formatted with dashes ("xx-xxx-xx-xx").
  const [phones, setPhones] = useState<string[]>(() => {
    const stripped = (me.phones ?? []).map(stripCountryCodeAndFormat);
    return stripped.length > 0 ? stripped : [""];
  });
  const [whatsapp, setWhatsapp] = useState<string>(
    stripCountryCodeAndFormat(me.whatsapp),
  );
  const [telegram, setTelegram] = useState<string>(me.telegram ?? "");
  const [instagram, setInstagram] = useState<string>(me.instagram ?? "");
  const [tiktok, setTiktok] = useState<string>(me.tiktok ?? "");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updatePhone = (idx: number, raw: string) => {
    setPhones((prev) =>
      prev.map((p, i) => (i === idx ? formatPhoneLocal(raw) : p)),
    );
  };

  const addPhone = () => {
    if (phones.length >= MAX_PHONES) return;
    setPhones((prev) => [...prev, ""]);
  };

  const removePhone = (idx: number) => {
    if (idx === 0) return; // first slot is permanent
    setPhones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const yearsNum = years.trim() ? Number(years) : undefined;
      const cleanedPhones = phones
        .map((p) => composeE164(p))
        .filter((v): v is string => v !== null);
      const wa = composeE164(whatsapp);
      const tg = telegram.trim() || null;
      const ig = instagram.trim() || null;
      const tt = tiktok.trim() || null;

      const trimmedName = name.trim();
      // Mirror the name on the auth user so the dashboard greeting (which
      // reads from `useStore.currentUser()`) updates immediately.
      if (authUser && trimmedName) {
        updateCurrentUser({ name: trimmedName });
      }
      await updateProvider(me.id, {
        name: trimmedName || undefined,
        bio: { az: bioAz.trim(), ru: bioRu.trim() },
        experienceYears:
          yearsNum && !Number.isNaN(yearsNum) ? yearsNum : undefined,
        gallery,
        avatar,
        phones: cleanedPhones,
        whatsapp: wa,
        telegram: tg,
        instagram: ig,
        tiktok: tt,
      });

      router.push("/dashboard");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[ProfileEditor.handleSave] failed", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err);
      setErrorMsg(message);
      setSavedAt(null);
    } finally {
      setSaving(false);
    }
  };

  const canAddPhone = phones.length < MAX_PHONES;

  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 pb-24 pt-6">
      <Crumbs
        items={[
          { label: t("crumbs.catalog"), href: "/" },
          { label: t("nav.becomeProvider"), href: "/dashboard" },
          { label: t("dash.profile.title") },
        ]}
        className="mb-6"
      />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t("dash.profile.back")}
      </Link>

      <header className="mb-8">
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.015em]">
          {t("dash.profile.title")}
        </h1>
        <p className="text-ink-500 mt-2">{t("dash.profile.subtitle")}</p>
      </header>

      <Card className="p-5 flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => avatarFileRef.current?.click()}
          className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caspian-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={lang === "ru" ? "Изменить фото" : "Şəkli dəyiş"}
        >
          <Avatar
            name={name.trim() || authUser?.name?.trim() || me.name}
            id={authUser?.id ?? me.id}
            imageUrl={avatar}
            size="lg"
          />
          <span className="absolute inset-0 rounded-full bg-ink-900/55 grid place-items-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="size-5" />
          </span>
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-xl text-ink-900 leading-tight">
            {name.trim() ||
              authUser?.name?.trim() ||
              (lang === "ru" ? "Пользователь" : "İstifadəçi")}
          </h2>
          <p className="text-sm text-ink-500 truncate">
            {avatar
              ? lang === "ru"
                ? "Нажмите на фото, чтобы заменить"
                : "Şəkli dəyişmək üçün üzərinə basın"
              : lang === "ru"
                ? "Нажмите на аватар, чтобы добавить фото"
                : "Şəkil əlavə etmək üçün avatara basın"}
          </p>
        </div>
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleAvatarFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Card>

      <div className="space-y-6">
        <Section
          title={lang === "ru" ? "Имя" : "Ad"}
          subtitle={
            lang === "ru"
              ? "Так клиенты видят вас в каталоге и на дашборде"
              : "Müştərilər sizi kataloqda və panelde belə görür"
          }
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              lang === "ru" ? "Имя и фамилия" : "Ad və soyad"
            }
            aria-label={lang === "ru" ? "Имя" : "Ad"}
          />
        </Section>

        <Section
          title={t("dash.profile.section.bio.title")}
          subtitle={t("dash.profile.section.bio.sub")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
                {t("dash.profile.lang.az")}
              </span>
              <textarea
                value={bioAz}
                onChange={(e) => setBioAz(e.target.value)}
                placeholder={t("dash.profile.bio.placeholder")}
                rows={5}
                aria-label={t("dash.profile.lang.az")}
                className="w-full bg-surface border border-border-strong rounded-[10px] px-4 py-3 text-ink-800 placeholder:text-ink-400 hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)] transition-colors resize-y leading-relaxed"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
                {t("dash.profile.lang.ru")}
              </span>
              <textarea
                value={bioRu}
                onChange={(e) => setBioRu(e.target.value)}
                placeholder={t("dash.profile.bio.placeholder")}
                rows={5}
                aria-label={t("dash.profile.lang.ru")}
                className="w-full bg-surface border border-border-strong rounded-[10px] px-4 py-3 text-ink-800 placeholder:text-ink-400 hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)] transition-colors resize-y leading-relaxed"
              />
            </label>
          </div>
        </Section>

        <Section
          title={t("dash.profile.section.experience.title")}
          subtitle={t("dash.profile.section.experience.sub")}
        >
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="5"
              />
            </div>
            <span className="text-ink-500">
              {t("dash.profile.experience.years")}
            </span>
          </div>
        </Section>

        {/* ─── Contacts ─── */}
        <Section
          title={lang === "ru" ? "Контактные данные" : "Əlaqə məlumatları"}
          subtitle={
            lang === "ru"
              ? "До 3 номеров, плюс мессенджеры и соцсети"
              : "3 nömrəyə qədər və messencer/sosial şəbəkə hesabları"
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LEFT column — phones + WhatsApp share one grid so col widths align */}
            <div className="grid grid-cols-[1fr_auto] gap-2">
              {phones.map((value, i) => (
                <Fragment key={i}>
                  <PhoneField
                    value={value}
                    onChange={(v) => updatePhone(i, v)}
                    aria-label={`Phone ${i + 1}`}
                  />
                  <PhoneRowButton
                    isFirst={i === 0}
                    canAdd={canAddPhone}
                    onAdd={addPhone}
                    onRemove={() => removePhone(i)}
                    lang={lang}
                  />
                </Fragment>
              ))}
              <PhoneField
                value={whatsapp}
                onChange={setWhatsapp}
                icon={<MessageCircle className="size-3.5" />}
                aria-label="WhatsApp"
              />
              <span aria-hidden className="size-11 shrink-0" />
            </div>

            {/* RIGHT column — Telegram + Instagram + TikTok */}
            <div className="flex flex-col gap-2">
              <Input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="Telegram (@username)"
                icon={<SharedTelegramIcon />}
              />
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram (@username)"
                icon={<InstagramIcon />}
              />
              <Input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="TikTok (@username)"
                icon={<TikTokIcon />}
              />
            </div>
          </div>
        </Section>

        <Section
          title={t("dash.profile.section.gallery.title")}
          subtitle={t("dash.profile.section.gallery.sub")}
        >
          <GalleryUploader value={gallery} onChange={setGallery} />
        </Section>
      </div>

      {errorMsg ? (
        <div className="mt-6 rounded-[10px] border border-pomegranate-500/30 bg-pomegranate-500/5 px-3 py-2 text-sm text-pomegranate-500">
          {errorMsg}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 mt-8 sticky bottom-4">
        <AnimatePresence>
          {savedAt && (
            <motion.div
              key={savedAt}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="success-soft" pulse>
                <Check className="size-3" />
                {t("dash.profile.saved")}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("booking.confirming") : t("dash.profile.save")}
        </Button>
      </div>

      <p className="sr-only">{lang}</p>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PhoneField: fixed "+994" prefix + masked local-part input.
// Strips any pasted "+994" and applies xx-xxx-xx-xx formatting via the
// parent's onChange (which routes through formatPhoneLocal).
// ─────────────────────────────────────────────────────────────────────
function PhoneField({
  value,
  onChange,
  placeholder = "xx-xxx-xx-xx",
  icon,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch h-11 w-full min-w-0 rounded-[10px] border border-border-strong bg-surface overflow-hidden transition-colors hover:border-ink-300 focus-within:border-caspian-500 focus-within:shadow-[var(--sh-focus)]",
        className,
      )}
    >
      <span className="grid place-items-center px-3 bg-ink-50 text-ink-700 font-mono text-sm border-r border-border shrink-0">
        +994
      </span>
      {icon ? (
        <span className="grid place-items-center pl-3 text-ink-400 shrink-0">
          {icon}
        </span>
      ) : null}
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "flex-1 min-w-0 bg-transparent px-3 text-sm font-mono text-ink-800 placeholder:text-ink-400 outline-none",
          icon && "pl-2",
        )}
      />
    </div>
  );
}

// First slot always renders something (add button OR a same-sized spacer)
// so the phone-grid keeps consistent column widths regardless of count.
function PhoneRowButton({
  isFirst,
  canAdd,
  onAdd,
  onRemove,
  lang,
}: {
  isFirst: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
  lang: "az" | "ru";
}) {
  if (isFirst) {
    if (canAdd) {
      return (
        <button
          type="button"
          onClick={onAdd}
          aria-label={
            lang === "ru" ? "Добавить номер" : "Yeni nömrə əlavə et"
          }
          className="size-11 grid place-items-center rounded-[10px] border border-border-strong bg-surface text-ink-700 hover:bg-ink-50 hover:border-ink-300 transition-colors shrink-0"
        >
          <Plus className="size-4" />
        </button>
      );
    }
    // 3 phones reached → hide the +, but keep a spacer of the same width
    // so the PhoneField column doesn't expand for this row.
    return <span aria-hidden className="size-11 shrink-0" />;
  }
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={lang === "ru" ? "Удалить номер" : "Nömrəni sil"}
      className="size-11 grid place-items-center rounded-[10px] border border-border bg-surface text-ink-500 hover:text-pomegranate-500 hover:border-pomegranate-500/40 hover:bg-pomegranate-500/5 transition-colors shrink-0"
    >
      <Minus className="size-4" />
    </button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="font-display font-semibold text-lg text-ink-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm text-ink-500 mt-0.5 mb-4">{subtitle}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </Card>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden
      {...props}
    >
      <path d="M19.6 7.7a5.7 5.7 0 0 1-3.7-1.4 5.6 5.6 0 0 1-1.8-3.1h-3v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V10a5.6 5.6 0 0 0-.8-.1 5.6 5.6 0 1 0 5.6 5.6V9.4a8.6 8.6 0 0 0 5.5 1.9V8.4c-0.3 0-.7-.1-1 .1V7.7Z" />
    </svg>
  );
}
