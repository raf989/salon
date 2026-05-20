"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import {
  ConfettiBurst,
  useConfetti,
} from "@/components/ui/confetti-burst";
import { useT } from "@/lib/i18n";
import { deleteImage, uploadImage, validateImageFile } from "@/lib/api/storage";
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

  const [uploadingCount, setUploadingCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fireConfetti, confettiProps] = useConfetti();

  const remainingSlots = MAX_PHOTOS - value.length - uploadingCount;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, Math.max(0, remainingSlots));
    if (picked.length === 0) return;

    setErrorMsg(null);

    const list: File[] = [];
    let preflightError: string | null = null;
    for (const file of picked) {
      const invalid = validateImageFile(file);
      if (invalid) {
        if (!preflightError) {
          preflightError =
            invalid.code === "size"
              ? t("upload.error.size").replace("{mb}", invalid.mb)
              : t("upload.error.type");
        }
        continue;
      }
      list.push(file);
    }
    if (list.length === 0) {
      if (preflightError) setErrorMsg(preflightError);
      return;
    }

    setUploadingCount((c) => c + list.length);

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
    let firstError: string | null = preflightError;
    for (const r of results) {
      if (r.ok) urls.push(r.url);
      else if (!firstError) firstError = r.message;
    }
    if (urls.length > 0) {
      const next = [...value, ...urls];
      onChange(next);
      try {
        await updateProvider(providerId, { gallery: next });
        fireConfetti();
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
    if (url) {
      void deleteImage(url).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[GalleryUploader.removeAt] cleanup failed", err);
      });
    }
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    void updateProvider(providerId, { gallery: next }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[GalleryUploader.removeAt] persist failed", err);
    });
  };

  const uploadingTiles = Array.from({ length: uploadingCount });
  const hasContent = value.length > 0 || uploadingCount > 0;
  const showAddTile = MAX_PHOTOS - value.length - uploadingCount > 0;

  // Drag-over handlers — apply to the outer root so dropping anywhere
  // inside the grid works, not just on the explicit "+" tile.
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setDragOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDragLeave = (e: React.DragEvent) => {
    // Only clear when the leave event escapes the root container.
    if (e.currentTarget === e.target) setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      data-tour="gallery"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "rounded-2xl transition-all",
        dragOver &&
          "ring-2 ring-violet-500 shadow-[var(--sh-glow-magenta)] p-1",
      )}
    >
      <ConfettiBurst
        trigger={confettiProps.trigger}
        onDone={confettiProps.onDone}
      />
      {!hasContent ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border-strong",
            "glass flex flex-col items-center justify-center gap-2 text-ink-500",
            "transition-all hover:border-violet-500 hover:text-violet-300 hover:shadow-[var(--sh-glow-violet)]",
          )}
        >
          <Plus className="size-6" />
          <span className="text-sm font-medium">
            {t("dash.profile.gallery.empty")}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {value.map((url, i) => (
            <div
              key={url || i}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden glass group",
                "transition-transform hover:-translate-y-0.5 hover:shadow-[var(--sh-glow-violet)]",
              )}
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
                className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-ink-900/80 text-white opacity-0 group-hover:opacity-100 hover:bg-danger-500 transition-all"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {uploadingTiles.map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden glass border border-border-strong flex flex-col items-center justify-center gap-2 text-ink-500"
              aria-busy="true"
              aria-live="polite"
            >
              <span className="size-6 rounded-full border-2 border-border-strong border-t-violet-500 animate-spin" />
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
                "aspect-square rounded-xl border-2 border-dashed border-border-strong",
                "bg-surface/30 flex flex-col items-center justify-center gap-1.5 text-ink-500",
                "transition-all hover:border-violet-500 hover:text-violet-300",
                "hover:shadow-[var(--sh-glow-violet)] hover:bg-violet-500/5",
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
        <p className="text-xs text-danger-500 mt-3">{errorMsg}</p>
      ) : null}
      <p className="text-xs text-ink-500 mt-3">
        {t("dash.profile.gallery.limit")}
      </p>
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
