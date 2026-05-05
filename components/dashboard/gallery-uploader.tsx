"use client";

import { useRef } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 8;

export function GalleryUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  const remainingSlots = MAX_PHOTOS - value.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, remainingSlots);
    const dataUrls = await Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );
    onChange([...value, ...dataUrls]);
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {value.length === 0 ? (
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
              key={i}
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
          {remainingSlots > 0 && (
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
      <p className="text-xs text-ink-400 mt-3">{t("dash.profile.gallery.limit")}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
