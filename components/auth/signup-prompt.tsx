"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Shared "log in to use this" dialog. Opens from any client surface that
// gates an action behind auth — currently HeartButton (favorite a
// provider) and FavoriteToggle (save a tender). Keep the copy generic so
// new call sites can reuse it without per-feature variants.
//
// Cancel is redundant with Dialog's X close button + backdrop click +
// Escape key, so the footer holds only the two real CTAs.
export function SignupPrompt({ open, onClose }: Props) {
  const { t } = useT();
  return (
    <Dialog open={open} onClose={onClose} title={t("auth.required.title")}>
      <p className="text-sm text-ink-600 leading-relaxed">
        {t("auth.required.body")}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/login"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-strong px-5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50"
        >
          {t("auth.required.login")}
        </Link>
        <Link
          href="/register"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-caspian-500 px-5 text-sm font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-caspian-600"
        >
          {t("auth.required.signUp")}
        </Link>
      </div>
    </Dialog>
  );
}
