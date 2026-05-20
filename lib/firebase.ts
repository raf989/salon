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
  EmailAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
  type UserCredential,
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
  // Stub mode: if any env var is missing, fill with dummy values so init
  // succeeds. Auth calls will fail at network time, but UI shell renders.
  const stubbed = { ...firebaseConfig };
  for (const [k, v] of Object.entries(stubbed)) {
    if (!v) {
      (stubbed as Record<string, string>)[k] = `stub-${k}`;
    }
  }
  const existing = getApps();
  appInstance = existing[0] ?? initializeApp(stubbed);
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
  // Reuse only if cache AND DOM agree — verifier still cached and its
  // iframe still mounted. Otherwise (e.g. previous attempt errored and
  // we cleared the cache; or fast-refresh remounted the container),
  // tear down whatever's left and start over.
  if (cached && container.childElementCount > 0) {
    return cached;
  }
  if (cached) {
    try {
      cached.clear();
    } catch {
      // Already torn down; ignore.
    }
    cache.delete(containerId);
  }
  // Firebase `clear()` doesn't always remove the iframe synchronously,
  // so before constructing a new verifier we wipe the container's DOM.
  // Without this, `new RecaptchaVerifier` on a container that still has
  // the previous reCAPTCHA iframe throws
  // "reCAPTCHA has already been rendered in this element".
  while (container.firstChild) {
    container.removeChild(container.firstChild);
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

// ---- phone + password ------------------------------------------------------
//
// Firebase Phone Auth is passwordless by design. To give users a
// phone+password login (OTP only at registration, password thereafter) we
// link an Email/Password credential onto the phone-authed account, using a
// synthetic email derived from the phone number. The user never sees this
// address — it's purely an internal Firebase identifier. Login then goes
// through `signInWithEmailAndPassword` with that synthetic email, returning
// the SAME UID the phone auth created.
//
// Requires the Email/Password provider enabled in Firebase Console
// (Authentication → Sign-in method).

// Domain is intentionally a non-routable .internal TLD — no email is ever
// sent here; it's just a unique, stable key built from the E.164 number.
const SYNTHETIC_EMAIL_DOMAIN = "phone.vaxt.internal";

/**
 * Map an E.164 phone (`+994516712881`) to the synthetic email used as the
 * Firebase Email/Password identifier (`994516712881@phone.vaxt.internal`).
 */
export function phoneToSyntheticEmail(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `${digits}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * After a successful phone-OTP confirmation, attach a password to the
 * currently signed-in user so they can log in later with phone+password
 * (no OTP). Idempotent-ish: if the credential is already linked (re-run),
 * Firebase throws `auth/provider-already-linked` / `auth/email-already-in-use`
 * — callers should treat those as "password already set" rather than fatal.
 */
export async function linkPasswordToCurrentUser(
  phoneE164: string,
  password: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("linkPasswordToCurrentUser: no signed-in user");
  }
  const credential = EmailAuthProvider.credential(
    phoneToSyntheticEmail(phoneE164),
    password,
  );
  await linkWithCredential(user, credential);
}

/**
 * Log in with phone + password — no SMS. Resolves the phone to its
 * synthetic email and delegates to `signInWithEmailAndPassword`. Re-throws
 * Firebase errors (`auth/invalid-credential`, `auth/user-not-found`, …) so
 * the caller can map them to friendly copy.
 */
export async function signInWithPhonePassword(
  phoneE164: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(
    getFirebaseAuth(),
    phoneToSyntheticEmail(phoneE164),
    password,
  );
}
