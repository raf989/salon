"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";
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
    <Dialog
      open={open}
      onClose={onClose}
      title={t("auth.required.title")}
      className="glass-strong rounded-2xl"
    >
      <p className="text-sm text-ink-500 leading-relaxed">
        {t("auth.required.body")}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:items-center">
        <Link href="/login" onClick={onClose} className="sm:inline-flex">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto">
            {t("auth.required.login")}
          </Button>
        </Link>
        <Link href="/register" onClick={onClose} className="sm:inline-flex">
          <MagneticButton
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            type="button"
          >
            {t("auth.required.signUp")}
          </MagneticButton>
        </Link>
      </div>
    </Dialog>
  );
}
