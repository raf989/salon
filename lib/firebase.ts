"use client";

// =============================================================================
// Firebase init + Phone Auth helpers.
//
// Auth strategy: Firebase Web SDK issues the ID token (signed RS256 against
// Firebase's published JWKS). Supabase Auth → Third-party providers is
// configured to trust this issuer, so the same token authenticates Supabase
// requests too. `lib/api/supabase.ts` injects the token via the SDK's
// `accessToken` callback — see that file.
//
// Module-level errors are intentional: every NEXT_PUBLIC_FIREBASE_* must be
// present at build time or the auth flow is broken; failing loud at boot
// beats mysterious 400s deep in the call tree.
// =============================================================================

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getApp(): FirebaseApp {
  if (appInstance) return appInstance;
  for (const [k, v] of Object.entries(firebaseConfig)) {
    if (!v) {
      throw new Error(
        `Firebase env missing: NEXT_PUBLIC_FIREBASE_${k
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()}. See .env.local.example.`,
      );
    }
  }
  // HMR / Next.js fast-refresh can re-execute this module; reuse the existing
  // instance instead of throwing "Firebase app already exists".
  const existing = getApps();
  appInstance = existing[0] ?? initializeApp(firebaseConfig);
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getApp());
  return authInstance;
}

// ---- Phone Auth helpers ---------------------------------------------------

// Per-containerId cache. We can't share one verifier across different
// container elements (e.g. /login uses #recaptcha-login while /register
// uses #recaptcha-register) — Firebase binds the verifier to a specific
// DOM node, and reusing it after that node unmounts throws
// "reCAPTCHA client element has been removed". A Map keyed by container
// ID + a DOM-presence check keeps each page's verifier honest.
type RecaptchaCache = Map<string, RecaptchaVerifier>;

function getCache(): RecaptchaCache {
  const w = window as Window & { __vaxtRecaptchaVerifiers?: RecaptchaCache };
  if (!w.__vaxtRecaptchaVerifiers) w.__vaxtRecaptchaVerifiers = new Map();
  return w.__vaxtRecaptchaVerifiers;
}

/**
 * Build (and cache by container ID) an invisible reCAPTCHA verifier.
 * Firebase requires this for `signInWithPhoneNumber`. If a verifier was
 * cached for the same container but its DOM node has since been removed
 * (e.g. navigated away and back), we tear down the stale one and create
 * a fresh widget.
 *
 * Caller must mount a `<div id={containerId} />` BEFORE calling this.
 */
export function getRecaptchaVerifier(
  containerId: string,
): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("getRecaptchaVerifier called server-side");
  }
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(
      `getRecaptchaVerifier: container #${containerId} not found in DOM`,
    );
  }
  const cache = getCache();
  const cached = cache.get(containerId);
  if (cached) {
    // Even with the right ID, the previous instance may have been
    // disposed (page navigation, fast refresh). Firebase doesn't expose
    // a `.isReady()` so we rely on a marker on the container: an active
    // verifier inserts an iframe/div as a child. If empty, treat stale.
    if (container.childElementCount > 0) {
      return cached;
    }
    try {
      cached.clear();
    } catch {
      // Already torn down; ignore.
    }
    cache.delete(containerId);
  }
  const verifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: "invisible",
  });
  cache.set(containerId, verifier);
  return verifier;
}

/**
 * Clear a cached reCAPTCHA — needed after a failed `signInWithPhoneNumber`
 * so the next attempt mounts a fresh widget. With no argument, clears
 * everything (sign-out path, hard reset). With a containerId, clears
 * only that one.
 */
export function resetRecaptchaVerifier(containerId?: string): void {
  if (typeof window === "undefined") return;
  const cache = getCache();
  const ids = containerId ? [containerId] : Array.from(cache.keys());
  for (const id of ids) {
    const v = cache.get(id);
    try {
      v?.clear();
    } catch {
      // Already torn down — ignore.
    }
    cache.delete(id);
  }
}

/**
 * Normalize various AZ phone formats to E.164 `+994XXXXXXXXX`. Mirrors the
 * intent of `lib/utils.ts:normalizePhone` but Firebase needs strict E.164
 * for `signInWithPhoneNumber`. Returns null on invalid input.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  let core = digits;
  if (core.startsWith("994")) core = core.slice(3);
  else if (core.startsWith("0")) core = core.slice(1);
  if (core.length !== 9) return null;
  return `+994${core}`;
}

/**
 * Send an SMS verification code. Returns a `ConfirmationResult` whose
 * `.confirm(code)` finalizes sign-in. Re-throws Firebase errors so the
 * caller can surface user-friendly messages keyed on error.code.
 */
export async function sendPhoneOtp(
  phoneE164: string,
  containerId: string,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  // Match the user's UI locale so the (invisible) reCAPTCHA challenge text
  // and any fallback dialogs render in their language.
  auth.useDeviceLanguage();
  const verifier = getRecaptchaVerifier(containerId);
  try {
    return await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (err) {
    // A failed attempt invalidates the widget — Firebase docs explicitly
    // require resetting it before retrying. Scope the reset to this
    // page's container so a parallel mount on another page isn't nuked.
    resetRecaptchaVerifier(containerId);
    throw err;
  }
}
