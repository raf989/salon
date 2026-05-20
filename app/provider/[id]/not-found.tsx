"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const { t, pickLocalized } = useT();
  return (
    <main className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden text-center">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 30% 20%, rgba(255,61,157,0.14), transparent 60%), radial-gradient(45% 50% at 70% 20%, rgba(155,108,246,0.14), transparent 60%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center max-w-md"
      >
        <span className="text-[110px] md:text-[160px] font-display font-semibold leading-none gradient-text-aurora">
          404
        </span>
        <h1 className="mt-2 font-display font-semibold text-xl md:text-2xl text-ink-900">
          {t("notfound.provider")}
        </h1>
        <p className="mt-3 text-ink-500 max-w-sm">
          {pickLocalized({
            az: "Bəlkə icraçı profilini sildi və ya URL səhvdir. Kataloqa qayıt — orada hamı var.",
            ru: "Возможно исполнитель удалил профиль или URL неверный. Вернись в каталог — там все.",
          })}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md">
              <ArrowLeft className="size-4" strokeWidth={2} />
              {t("notfound.backToCatalog")}
            </Button>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500 font-mono">
            {pickLocalized({ az: "və ya", ru: "или нажми" })}
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-border-strong bg-bg-elevated/40 text-[10px] text-ink-300">
              ⌘ K
            </kbd>
            <Search className="size-3" strokeWidth={1.8} />
          </span>
        </div>
      </motion.div>
    </main>
  );
}
