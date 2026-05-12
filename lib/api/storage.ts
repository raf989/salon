"use client";

import { supabase } from "./supabase";

// =============================================================================
// Storage helpers
//
// Provider avatars + gallery images live in the `provider-images` bucket
// (public, 5 MB max, image/* only — see
// supabase/migrations/20260513000000_storage_bucket.sql).
//
// Object paths are namespaced per provider so a delete cascade is trivial:
//   <providerId>/avatar/<timestamp>-<rand>.<ext>
//   <providerId>/gallery/<timestamp>-<rand>.<ext>
// =============================================================================

const BUCKET = "provider-images";

// Public URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/provider-images/<path>
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/**
 * Mirror of `asError` from `lib/api/repo.ts`. Supabase Storage returns plain
 * `{ message, error, statusCode }` objects on failure; throwing those directly
 * surfaces as "[object Object]" in the Next.js error overlay. Wrap them so the
 * cause is visible everywhere (overlay, console, inline error banners).
 */
function asError(err: unknown, context: string): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      error?: string;
      statusCode?: string | number;
    };
    const parts = [
      context,
      e.message,
      e.error,
      e.statusCode ? `[${e.statusCode}]` : null,
    ].filter(Boolean);
    const wrapped = new Error(parts.join(" — "));
    (wrapped as Error & { cause?: unknown }).cause = err;
    return wrapped;
  }
  return new Error(`${context}: ${String(err)}`);
}

function extFromFile(file: File): string {
  // Prefer the MIME type — it's normalized by the browser. Fall back to the
  // filename's extension for the rare case where the type is blank.
  const fromMime = file.type.split("/")[1]?.toLowerCase();
  if (fromMime) {
    // image/jpeg → jpg for a friendlier extension
    return fromMime === "jpeg" ? "jpg" : fromMime;
  }
  const dot = file.name.lastIndexOf(".");
  if (dot >= 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toLowerCase();
  }
  return "bin";
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Upload an image to the `provider-images` bucket and return its public URL.
 *
 * @param file        Browser File from a <input type=file> change event.
 * @param kind        Either "avatar" or "gallery" — used as a path namespace.
 * @param providerId  Owning provider; becomes the top-level folder.
 */
export async function uploadImage(
  file: File,
  kind: "avatar" | "gallery",
  providerId: string,
): Promise<string> {
  const ext = extFromFile(file);
  const path = `${providerId}/${kind}/${Date.now()}-${randomToken()}.${ext}`;

  const uploadRes = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (uploadRes.error) throw asError(uploadRes.error, "uploadImage");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("uploadImage — no public URL returned");
  }
  return data.publicUrl;
}

/**
 * Delete an image from the bucket given its public URL. Silently no-ops for
 * non-Supabase URLs (legacy `data:image/...` strings, external links), so
 * callers don't have to guard before calling.
 */
export async function deleteImage(url: string): Promise<void> {
  if (!url || typeof url !== "string") return;
  // data: URLs and any non-https reference can't live in Supabase Storage.
  if (!url.startsWith("https://")) return;
  const idx = url.indexOf(PUBLIC_PREFIX);
  if (idx === -1) return; // external URL — not ours to delete.

  const path = url.slice(idx + PUBLIC_PREFIX.length).split("?")[0];
  if (!path) return;

  const res = await supabase.storage.from(BUCKET).remove([path]);
  if (res.error) throw asError(res.error, "deleteImage");
}
