// =============================================================================
// Repo public surface — barrel.
//
// All hooks and mutations call Supabase. Components don't import @supabase
// directly — only this module talks to it. The actual implementations live
// in `_repo/*`; this file just re-exports them so existing imports keep
// working: `import { useProviders, submitBid } from "@/lib/api/repo"`.
//
// _repo/ uses an underscore prefix to signal "internal — don't import
// directly". Always go through this barrel.
// =============================================================================

export * from "./_repo/shared";
export * from "./_repo/users";
export * from "./_repo/providers";
export * from "./_repo/services";
export * from "./_repo/appointments";
export * from "./_repo/tenders";
export * from "./_repo/reviews";
