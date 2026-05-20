"use client";

import { motion } from "framer-motion";
import { ChevronRight, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/landing-data";
import { useT } from "@/lib/i18n";

const COPY = {
  eyebrow: { az: "FAQ", ru: "FAQ" },
  title: {
    az: "Tez-tez verilən suallar",
    ru: "Часто задаваемые вопросы",
  },
  subtitle: {
    az: "Suallarına cavab tapa bilməsən — yaz, 1 saat içində cavab veririk.",
    ru: "Не нашёл ответ — напиши нам, ответим в течение часа.",
  },
  contact: { az: "Bizimlə əlaqə", ru: "Связаться с нами" },
};

const LEFT_VARIANTS = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const RIGHT_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.1,
    },
  },
};

export function FAQ() {
  const { pickLocalized } = useT();

  return (
    <section
      className="relative isolate py-20 md:py-28"
      style={{
        background:
          "radial-gradient(50% 60% at 100% 0%, rgba(80,200,220,0.05), transparent)",
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        {/* LEFT — copy block */}
        <motion.div
          variants={LEFT_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start"
        >
          <span className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {pickLocalized(COPY.eyebrow)}
          </span>

          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-900 md:text-5xl">
            {pickLocalized(COPY.title)}
          </h2>

          <p className="max-w-sm text-ink-500">
            {pickLocalized(COPY.subtitle)}
          </p>

          <a
            href="#"
            className="group inline-flex items-center gap-1.5 self-start text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
          >
            <span>{pickLocalized(COPY.contact)}</span>
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        </motion.div>

        {/* RIGHT — accordion */}
        <motion.div
          variants={RIGHT_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="glass rounded-2xl p-2 md:p-4"
        >
          <Accordion type="single">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="border-border last:border-b-0"
              >
                <AccordionTrigger className="py-5 text-base md:text-lg">
                  {pickLocalized(item.q)}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-ink-500 md:text-[15px]">
                  {pickLocalized(item.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
