"use client";

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Storage helpers
//
// Provider avatars + gallery images live in the `provider-images` bucket
// (public, 5 MB max, image/* only — see supabase/migrations/005_storage.sql).
//
// Object paths are namespaced per provider so a delete cascade is trivial:
//   <providerId>/avatar/<timestamp>-<rand>.<ext>
//   <providerId>/gallery/<timestamp>-<rand>.<ext>
//
// IMPORTANT — dedicated client, NO Firebase token.
// The main `supabase` client (lib/api/supabase.ts) injects the Firebase ID
// token via the `accessToken` callback. PostgREST validates that token via
// the Third-Party Auth integration, but Supabase Storage does NOT honor
// third-party JWTs the same way — sending the Firebase token to Storage
// gets the request rejected as an invalid JWT, which is what made avatar /
// gallery uploads silently fail.
//
// The `provider-images` bucket is demo-open (005_storage.sql: anon may
// CRUD), so a plain anon-key client uploads fine. When RLS is tightened
// later, storage ownership moves to a signed-URL or edge-function flow.
// =============================================================================

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envKey) {
  const msg =
    "[storage] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.";
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${msg} Set them in the deployment environment.`);
  }
  console.warn(`${msg} Running in stub mode — uploads will fail at runtime.`);
}

const SUPABASE_URL = envUrl || "http://localhost:54321";
const SUPABASE_ANON_KEY = envKey || "stub-anon-key";

const storageClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  // Deliberately NO `accessToken` callback — see the note above.
});

const BUCKET = "provider-images";

// Match the bucket policy (see 005_storage.sql) exactly. Validate on the
// client so the user gets a friendly, actionable message instead of a
// generic 413 / mime rejection after a full upload round-trip — which is
// what made "can't upload a photo" feel like the form was broken.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Public URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/provider-images/<path>
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/**
 * Pre-flight check for an image file against the bucket's policy. Returns
 * null when the file is fine, or a structured reason the caller localizes.
 * `mb` is the file's actual size for the size message.
 *
 * Note `<input accept="image/*">` still lets the OS offer HEIC (iPhone) or
 * AVIF — formats the bucket rejects — so this check is load-bearing, not
 * cosmetic.
 */
export type ImageValidationError =
  | { code: "type"; got: string }
  | { code: "size"; mb: string };

export function validateImageFile(file: File): ImageValidationError | null {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { code: "type", got: file.type || "unknown" };
  }
  if (file.size > MAX_BYTES) {
    return { code: "size", mb: (file.size / (1024 * 1024)).toFixed(1) };
  }
  return null;
}

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
  // Defense in depth: callers should validate first (and show a localized
  // message), but never let an out-of-policy file reach the server.
  const invalid = validateImageFile(file);
  if (invalid) {
    throw new Error(
      invalid.code === "size"
        ? `uploadImage — file too large (${invalid.mb} MB, max 5 MB)`
        : `uploadImage — unsupported format (${invalid.got}; use JPG/PNG/WebP/GIF)`,
    );
  }
  const ext = extFromFile(file);
  const path = `${providerId}/${kind}/${Date.now()}-${randomToken()}.${ext}`;

  const uploadRes = await storageClient.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (uploadRes.error) {
    // Log the raw Supabase error so it's always visible in the console even
    // when the caller shows a trimmed message in the UI.
    // eslint-disable-next-line no-console
    console.error("[uploadImage] Supabase storage error:", uploadRes.error);
    throw asError(uploadRes.error, "uploadImage");
  }

  const { data } = storageClient.storage.from(BUCKET).getPublicUrl(path);
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

  const res = await storageClient.storage.from(BUCKET).remove([path]);
  if (res.error) throw asError(res.error, "deleteImage");
}
