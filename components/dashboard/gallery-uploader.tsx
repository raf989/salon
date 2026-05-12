"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { deleteImage, uploadImage } from "@/lib/api/storage";
import { updateProvider } from "@/lib/api/repo";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 8;

export function GalleryUploader({
  value,
  onChange,
  providerId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  providerId: string;
}) {
  const { t, lang } = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  // Count of in-flight uploads — drives the placeholder tiles. Using a count
  // (not a boolean) lets us render one shimmer tile per file when several are
  // picked at once.
  const [uploadingCount, setUploadingCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const remainingSlots = MAX_PHOTOS - value.length - uploadingCount;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, Math.max(0, remainingSlots));
    if (list.length === 0) return;

    setErrorMsg(null);
    setUploadingCount((c) => c + list.length);

    // Uploads run in parallel; each result is appended individually so we get
    // partial-progress semantics if one fails.
    const uploads = list.map(async (file) => {
      try {
        const url = await uploadImage(file, "gallery", providerId);
        return { ok: true as const, url };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[GalleryUploader.handleFiles] upload failed", err);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : JSON.stringify(err);
        return { ok: false as const, message };
      }
    });

    const results = await Promise.all(uploads);
    const urls: string[] = [];
    let firstError: string | null = null;
    for (const r of results) {
      if (r.ok) urls.push(r.url);
      else if (!firstError) firstError = r.message;
    }
    if (urls.length > 0) {
      const next = [...value, ...urls];
      onChange(next);
      // Persist immediately so a reload before the main Save click doesn't
      // lose the uploads (the files would otherwise become bucket orphans).
      try {
        await updateProvider(providerId, { gallery: next });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[GalleryUploader.handleFiles] persist failed", err);
        if (!firstError) {
          firstError = err instanceof Error ? err.message : String(err);
        }
      }
    }
    if (firstError) setErrorMsg(firstError);
    setUploadingCount((c) => Math.max(0, c - list.length));
  };

  const removeAt = (idx: number) => {
    const url = value[idx];
    // Fire-and-forget: don't block the UI on the storage round-trip, and
    // tolerate legacy data URLs / external links (deleteImage no-ops on them).
    if (url) {
      void deleteImage(url).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[GalleryUploader.removeAt] cleanup failed", err);
      });
    }
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    // Mirror the delete in the DB right away — same reason as uploads.
    void updateProvider(providerId, { gallery: next }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[GalleryUploader.removeAt] persist failed", err);
    });
  };

  const uploadingTiles = Array.from({ length: uploadingCount });
  const hasContent = value.length > 0 || uploadingCount > 0;
  // "Add" tile shows when there's still capacity for another upload.
  const showAddTile = MAX_PHOTOS - value.length - uploadingCount > 0;

  return (
    <div>
      {!hasContent ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border-strong bg-bg/50 hover:bg-ink-50 hover:border-caspian-500 transition-colors flex flex-col items-center justify-center gap-2 text-ink-500"
        >
          <Plus className="size-6" />
          <span className="text-sm font-medium">{t("dash.profile.gallery.empty")}</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {value.map((url, i) => (
            <div
              key={url || i}
              className="relative aspect-square rounded-xl overflow-hidden bg-ink-50 group"
            >
              <Image
                src={url}
                alt={`photo ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                aria-label={t("dash.profile.gallery.remove")}
                onClick={() => removeAt(i)}
                className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-ink-900/80 text-white opacity-0 group-hover:opacity-100 hover:bg-pomegranate-500 transition-all"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {uploadingTiles.map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-ink-50 border border-border-strong flex flex-col items-center justify-center gap-2 text-ink-500"
              aria-busy="true"
              aria-live="polite"
            >
              <span className="size-6 rounded-full border-2 border-ink-300 border-t-caspian-500 animate-spin" />
              <span className="text-xs font-medium">
                {lang === "ru" ? "Загрузка…" : "Yüklənir…"}
              </span>
            </div>
          ))}
          {showAddTile && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "aspect-square rounded-xl border-2 border-dashed border-border-strong bg-bg/50 hover:bg-ink-50 hover:border-caspian-500 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink-500",
              )}
            >
              <Plus className="size-5" />
              <span className="text-xs font-medium">
                {t("dash.profile.gallery.add")}
              </span>
            </button>
          )}
        </div>
      )}
      {errorMsg ? (
        <p className="text-xs text-pomegranate-500 mt-3">{errorMsg}</p>
      ) : null}
      <p className="text-xs text-ink-400 mt-3">{t("dash.profile.gallery.limit")}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
