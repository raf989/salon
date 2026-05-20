"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OnboardingTour,
  type Step,
} from "@/components/ui/onboarding-tour";
import { POST_REGISTER_TOUR } from "@/lib/landing-data";
import { useT } from "@/lib/i18n";

const FLAG_KEY = "vaxt:show-onboarding-tour";

export function PostRegisterTour() {
  const { pickLocalized } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(FLAG_KEY) !== "1") return;
    // Let the dashboard render and lay out before targeting selectors.
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const steps: Step[] = useMemo(
    () =>
      POST_REGISTER_TOUR.map((s) => ({
        selector: s.selector,
        title: pickLocalized(s.title),
        body: pickLocalized(s.body),
        action: s.action,
        cursorOffset: s.cursorOffset,
      })),
    [pickLocalized],
  );

  const onClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(FLAG_KEY);
    }
  };

  if (!open) return null;
  return <OnboardingTour open={open} onClose={onClose} steps={steps} />;
}
