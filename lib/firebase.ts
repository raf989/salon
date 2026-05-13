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

/**
 * Build (and cache on the global window) an invisible reCAPTCHA tied to a
 * container element. Firebase requires this verifier for `signInWithPhoneNumber`.
 *
 * Caller must mount a `<div id={containerId} />` somewhere in the DOM before
 * calling this. The verifier is reused across multiple calls so the user
 * isn't re-challenged within one session.
 */
export function getRecaptchaVerifier(
  containerId: string,
): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("getRecaptchaVerifier called server-side");
  }
  const w = window as Window & {
    __vaxtRecaptchaVerifier?: RecaptchaVerifier;
  };
  if (w.__vaxtRecaptchaVerifier) return w.__vaxtRecaptchaVerifier;
  const verifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: "invisible",
  });
  w.__vaxtRecaptchaVerifier = verifier;
  return verifier;
}

/**
 * Clear the cached reCAPTCHA — needed after a failed `signInWithPhoneNumber`
 * so the next attempt mounts a fresh widget. Call this in the catch block
 * of OTP send failures.
 */
export function resetRecaptchaVerifier(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __vaxtRecaptchaVerifier?: RecaptchaVerifier;
  };
  try {
    w.__vaxtRecaptchaVerifier?.clear();
  } catch {
    // Verifier may already be torn down; safe to ignore.
  }
  w.__vaxtRecaptchaVerifier = undefined;
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
    // require resetting it before retrying.
    resetRecaptchaVerifier();
    throw err;
  }
}
