"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-ink-900 mb-3">404</h1>
      <p className="text-ink-500 mb-6">{t("notfound.provider")}</p>
      <Link href="/" className="text-caspian-600 hover:underline">
        {t("notfound.backToCatalog")}
      </Link>
    </main>
  );
}
