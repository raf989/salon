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
import { updateProvider } from "@/lib/api/repo";
import { deleteImage, uploadImage, validateImageFile } from "@/lib/api/storage";
import { useMyProvider, type MyProviderStatus } from "@/lib/use-my-provider";
import { useT } from "@/lib/i18n";
import { useCurrentUser, useStore } from "@/lib/store";
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
// Outer wrapper: auth-guards, resolves the signed-in provider's own row
// (by Firebase UID — not the seed-era `useProviders()[0]` hack), and only
// then renders the editor. The inner editor receives a non-null `me` so
// all useState initializers see real values on first render.
// ───────────────────────────────────────────────────────────────────────
export default function DashboardProfilePage() {
  // Same self-healing resolver the dashboard uses — anonymous → /login and
  // clients → / are handled inside the hook.
  const { status, me } = useMyProvider();

  // Non-ready states render a visible panel — never a blank page (which
  // made the editor look "gone").
  if (status !== "ready" || !me) {
    return <ProviderStatusPanel status={status} />;
  }
  return <ProfileEditor key={me.id} me={me} />;
}

// Loading spinner / no-provider recovery card for the non-ready states.
// Accepts the full status union; anything that isn't "incomplete" (i.e.
// "loading", and the unreachable "ready") shows the spinner.
function ProviderStatusPanel({ status }: { status: MyProviderStatus }) {
  const { t } = useT();
  if (status !== "incomplete") {
    return (
      <main className="mx-auto max-w-2xl px-4 md:px-6 pt-24 pb-24">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="size-9 rounded-full border-2 border-ink-200 border-t-caspian-500 animate-spin" />
          <p className="text-sm text-ink-500">{t("dash.loadingProfile")}</p>
        </div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 pt-16 pb-24">
      <Card className="p-8 text-center flex flex-col items-center gap-4">
        <h1 className="font-display font-semibold text-2xl text-ink-900">
          {t("dash.noProvider.title")}
        </h1>
        <p className="text-sm text-ink-500">{t("dash.noProvider.body")}</p>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="md">
              {t("dash.profile.back")}
            </Button>
          </Link>
          <Link href="/register?type=provider">
            <Button variant="primary" size="md">
              {t("dash.noProvider.cta")}
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

function ProfileEditor({ me }: { me: Stylist }) {
  const { t } = useT();
  const router = useRouter();

  // The greeting on the dashboard reads from the authenticated user, so the
  // edit form pre-fills the same source. Falls back to the provider record
  // only if there is no logged-in user yet (and never to the seeded "Elvin").
  const authUser = useCurrentUser();
  const updateCurrentUser = useStore((s) => s.updateCurrentUser);
  const initialName = authUser?.name?.trim() ?? "";
  const [name, setName] = useState<string>(initialName);
  // Single bio field — mirrored into both `az` and `ru` slots at save time
  // since the rest of the UI still reads via pickLocalized. Initialise from
  // whichever locale has content (prefer current lang, fall back to other).
  const [bio, setBio] = useState<string>(
    me.bio?.az?.trim() || me.bio?.ru?.trim() || "",
  );
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (file: File | null | undefined) => {
    if (!file) return;
    setAvatarError(null);
    // Pre-flight: catch oversized / wrong-format files BEFORE the upload
    // round-trip so the user sees a clear localized reason, not a raw 413.
    const invalid = validateImageFile(file);
    if (invalid) {
      setAvatarError(
        invalid.code === "size"
          ? t("upload.error.size").replace("{mb}", invalid.mb)
          : t("upload.error.type"),
      );
      return;
    }
    setAvatarUploading(true);
    const previous = avatar;
    try {
      const url = await uploadImage(file, "avatar", me.id);
      setAvatar(url);
      // Persist to the DB immediately — otherwise reloading the page before
      // the user hits the main Save button loses the upload and orphans the
      // file in Storage. updateProvider does a column-scoped UPDATE, so it
      // won't clobber other unsaved form state.
      await updateProvider(me.id, { avatar: url });
      // Fire-and-forget cleanup of the prior Supabase-hosted avatar so the
      // bucket doesn't fill up with orphans. Skip external/data URLs.
      if (previous && previous.startsWith("https://")) {
        void deleteImage(previous).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[ProfileEditor.handleAvatarFile] cleanup failed", err);
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[ProfileEditor.handleAvatarFile] upload failed", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err);
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
    }
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
        bio: { az: bio.trim(), ru: bio.trim() },
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
          disabled={avatarUploading}
          className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caspian-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed"
          aria-label={t("dash.profile.avatar.change")}
        >
          <Avatar
            name={name.trim() || authUser?.name?.trim() || me.name}
            id={authUser?.id ?? me.id}
            imageUrl={avatar}
            size="lg"
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-ink-900/55 grid place-items-center text-white transition-opacity",
              avatarUploading
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            {avatarUploading ? (
              <span className="size-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Camera className="size-5" />
            )}
          </span>
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-xl text-ink-900 leading-tight">
            {name.trim() ||
              authUser?.name?.trim() ||
              t("dash.profile.user.fallback")}
          </h2>
          <p className="text-sm text-ink-500 truncate">
            {avatarUploading
              ? t("dash.profile.avatar.uploading")
              : avatar
                ? t("dash.profile.avatar.replace")
                : t("dash.profile.avatar.add")}
          </p>
          {avatarError ? (
            <p className="text-xs text-pomegranate-500 mt-1">{avatarError}</p>
          ) : null}
        </div>
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleAvatarFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Card>

      <div className="space-y-6">
        <Section
          title={t("dash.profile.section.name.title")}
          subtitle={t("dash.profile.section.name.sub")}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("dash.profile.name.placeholder")}
            aria-label={t("dash.profile.section.name.title")}
          />
        </Section>

        <Section title={t("dash.profile.section.bio.title")}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("dash.profile.bio.placeholder")}
            rows={5}
            aria-label={t("dash.profile.section.bio.title")}
            className="w-full bg-surface border border-border-strong rounded-[10px] px-4 py-3 text-ink-800 placeholder:text-ink-400 hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)] transition-colors resize-y leading-relaxed"
          />
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
          title={t("dash.profile.section.contacts.title")}
          subtitle={t("dash.profile.section.contacts.sub")}
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
          <GalleryUploader
            value={gallery}
            onChange={setGallery}
            providerId={me.id}
          />
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
}: {
  isFirst: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  if (isFirst) {
    if (canAdd) {
      return (
        <button
          type="button"
          onClick={onAdd}
          aria-label={t("dash.profile.phone.add")}
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
      aria-label={t("dash.profile.phone.remove")}
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
