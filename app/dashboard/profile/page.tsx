"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Crumbs } from "@/components/ui/crumbs";
import { GalleryUploader } from "@/components/dashboard/gallery-uploader";
import { PROVIDERS } from "@/lib/mock-data";
import { useStore, useProvider } from "@/lib/store";
import { useT } from "@/lib/i18n";

const ME_ID = PROVIDERS[0].id;

export default function DashboardProfilePage() {
  const { t, lang } = useT();
  const me = useProvider(ME_ID);
  const updateProviderEdit = useStore((s) => s.updateProviderEdit);

  const [bio, setBio] = useState(me?.bio[lang] ?? "");
  const [district, setDistrict] = useState(me?.district?.[lang] ?? "");
  const [years, setYears] = useState<string>(
    me?.experienceYears !== undefined ? String(me.experienceYears) : "",
  );
  const [gallery, setGallery] = useState<string[]>(me?.gallery ?? []);
  const [avatar, setAvatar] = useState<string | undefined>(me?.avatar);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!me) return null;

  const handleAvatarFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const yearsNum = years.trim() ? Number(years) : undefined;
    const bioVal = bio.trim();
    const districtVal = district.trim();
    updateProviderEdit(me.id, {
      bio: { az: bioVal, ru: bioVal },
      district: { az: districtVal, ru: districtVal },
      experienceYears: yearsNum && !Number.isNaN(yearsNum) ? yearsNum : undefined,
      gallery,
      avatar,
    });
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(null), 1800);
  };

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
        <Eyebrow className="mb-3">{t("dash.eyebrowPanel")}</Eyebrow>
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.015em]">
          {t("dash.profile.title")}
        </h1>
        <p className="text-ink-500 mt-2">{t("dash.profile.subtitle")}</p>
      </header>

      {/* Identity preview with avatar uploader */}
      <Card className="p-5 flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => avatarFileRef.current?.click()}
          className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caspian-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={lang === "ru" ? "Изменить фото" : "Şəkli dəyiş"}
        >
          <Avatar name={me.name} id={me.id} imageUrl={avatar} size="lg" />
          <span className="absolute inset-0 rounded-full bg-ink-900/55 grid place-items-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="size-5" />
          </span>
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-xl text-ink-900 leading-tight">
            {me.name}
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
          title={t("dash.profile.section.bio.title")}
          subtitle={t("dash.profile.section.bio.sub")}
        >
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("dash.profile.bio.placeholder")}
            rows={5}
            className="w-full bg-surface border border-border-strong rounded-[10px] px-4 py-3 text-ink-800 placeholder:text-ink-400 hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[var(--sh-focus)] transition-colors resize-y leading-relaxed"
          />
        </Section>

        <Section
          title={t("dash.profile.section.district.title")}
          subtitle={t("dash.profile.section.district.sub")}
        >
          <Input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={lang === "ru" ? "Баку, Насими" : "Bakı, Nəsimi"}
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
            <span className="text-ink-500">{t("dash.profile.experience.years")}</span>
          </div>
        </Section>

        <Section
          title={t("dash.profile.section.gallery.title")}
          subtitle={t("dash.profile.section.gallery.sub")}
        >
          <GalleryUploader value={gallery} onChange={setGallery} />
        </Section>
      </div>

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
        <Button variant="primary" size="lg" onClick={handleSave}>
          {t("dash.profile.save")}
        </Button>
      </div>

      {/* spacer + lang reminder for clarity */}
      <p className="sr-only">{lang}</p>
    </main>
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
      <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
      {subtitle && <p className="text-sm text-ink-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </Card>
  );
}

