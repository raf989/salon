"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

type Props = {
  provider: Provider;
};

export function AboutSection({ provider }: Props) {
  const { t, pickLocalized } = useT();
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="font-display font-semibold text-xl text-ink-800 mb-3">
        {t("section.about")}
      </h2>
      <p className="text-ink-500 leading-relaxed">{pickLocalized(provider.bio)}</p>
    </motion.section>
  );
}
