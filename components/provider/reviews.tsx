"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { RatingStars } from "@/components/ui/rating-stars";
import { useReviews } from "@/lib/api/repo";
import { useT } from "@/lib/i18n";
import type { Lang, Provider } from "@/lib/types";

type Props = {
  provider: Provider;
};

type DisplayReview = {
  id: string;
  name: string;
  body: string;
  withGallery: boolean;
  rating: number;
};

// TODO: drop once "leave a review" UI ships and seed data exists for all providers.
function getMockReviews(lang: Lang): DisplayReview[] {
  return [
    {
      id: "rev_nm",
      name: "Nigar M.",
      body:
        lang === "ru"
          ? "Aysel сняла нашу свадьбу — каждый кадр живой, ничего постановочного. Прислала отбор за 4 дня."
          : "Aysel toy çəkilişimizi etdi — hər kadr canlı, heç biri quru deyil. Seçimi 4 gün ərzində göndərdi.",
      withGallery: true,
      rating: 5,
    },
    {
      id: "rev_rt",
      name: "Ramin T.",
      body:
        lang === "ru"
          ? "Юбилей мамы. Договорились с вечера на следующий день — пришла вовремя, сделала и формальные, и живые кадры."
          : "Anam üçün yubiley. Axşam axşam danışdıq, ertəsi gün vaxtında gəldi — həm rəsmi, həm canlı kadr çəkdi.",
      withGallery: false,
      rating: 5,
    },
  ];
}

export function Reviews({ provider }: Props) {
  const { t, lang, pickLocalized } = useT();
  const stored = useReviews(provider.id);
  const fromRepo: DisplayReview[] = stored.map((r) => ({
    id: r.id,
    name: r.authorName,
    body: pickLocalized(r.text),
    withGallery: false,
    rating: r.rating,
  }));
  const reviews = fromRepo.length > 0 ? fromRepo : getMockReviews(lang);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="font-display font-semibold text-xl text-ink-800 mb-3">
        {t("section.reviews")}
      </h2>

      <div className="flex flex-col">
        {reviews.map((review, i) => (
          <div
            key={review.id}
            className={
              i > 0
                ? "border-t border-border pt-4 mt-4 flex gap-3"
                : "flex gap-3"
            }
          >
            <Avatar name={review.name} id={review.id} size="md" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <b className="text-ink-900">{review.name}</b>
                <RatingStars value={review.rating} size={12} />
              </div>
              <p className="text-ink-500 text-sm leading-relaxed">
                {review.body}
              </p>
              {review.withGallery ? (
                <div className="grid grid-cols-4 gap-2 mt-1 max-w-md">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="aspect-square rounded-md overflow-hidden h-16"
                    >
                      <Cover
                        name={provider.name}
                        id={`${provider.id}rev1_${j}`}
                        kind={provider.kind}
                        aspect="1"
                        className="rounded-none h-full"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
