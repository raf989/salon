"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function HtmlLangSync() {
  const lang = useStore((s) => s.language);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
