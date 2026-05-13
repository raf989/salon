// Canonical URL builders for the four messenger/social platforms we link
// to. Previously duplicated across profile-card, profile-hero,
// sticky-booking and booking-modal — keep edits in one place so they
// can't drift.

/**
 * wa.me / WhatsApp deep link. Accepts raw input (phone, formatted
 * phone, or anything containing digits) and strips to digits only,
 * which is what the WhatsApp Click-to-Chat API expects.
 */
export function whatsappHref(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * t.me link. Accepts either a Telegram username (`@user`, `user`,
 * `https://t.me/user`) OR a phone number with country code. Phone-like
 * input becomes a `t.me/+digits` deep link that works as long as the
 * recipient has Telegram registered on that number.
 */
export function telegramHref(input: string): string | null {
  const raw = String(input).trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.length >= 10) {
    return digits ? `https://t.me/+${digits}` : null;
  }
  const handle = raw
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
    .replace(/\/+$/, "");
  return handle ? `https://t.me/${encodeURIComponent(handle)}` : null;
}

export function instagramHref(handle: string): string | null {
  const user = String(handle)
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  return user ? `https://instagram.com/${encodeURIComponent(user)}` : null;
}

export function tiktokHref(handle: string): string | null {
  const user = String(handle)
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "")
    .replace(/\/+$/, "");
  return user ? `https://tiktok.com/@${encodeURIComponent(user)}` : null;
}
