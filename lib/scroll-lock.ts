"use client";

// Reference-counted body scroll lock.
//
// Multiple overlays (Dialog, command palette, onboarding tour, gallery
// lightbox) can be open at once. A plain save/restore of
// `document.body.style.overflow` lets the inner overlay's cleanup unlock
// scrolling while an outer overlay is still open — or leave it locked after
// everything closed. The counter restores `overflow` only when the LAST
// lock releases.

let lockCount = 0;
let prevOverflow = "";

/**
 * Lock body scroll. Returns a release function — call it once (e.g. from a
 * `useEffect` cleanup). Calling release more than once is a no-op.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = prevOverflow;
    }
  };
}
