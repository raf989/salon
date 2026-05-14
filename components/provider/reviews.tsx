"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { useReviews } from "@/lib/api/repo";
import { useT } from "@/lib/i18n";
import type { Provider } from "@/lib/types";
import { LeaveReviewModal } from "@/components/provider/leave-review-modal";

type Props = {
  provider: Provider;
};

export function Reviews({ provider }: Props) {
  const { t, pickLocalized } = useT();
  const reviews = useReviews(provider.id);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-display font-semibold text-xl text-ink-800 flex items-baseline gap-2">
          {t("section.reviews")}
          <span className="font-sans font-medium text-base text-ink-400">
            {provider.reviewsCount}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLeaveOpen(true)}
        >
          {t("reviews.leave")}
        </Button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-ink-500 text-sm py-6">{t("reviews.empty")}</p>
      ) : (
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
              <Avatar
                name={review.authorName}
                id={review.authorName}
                size="md"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <b className="text-ink-900">{review.authorName}</b>
                  <RatingStars value={review.rating} size={16} />
                </div>
                <p className="text-ink-500 text-sm leading-relaxed">
                  {pickLocalized(review.text)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveReviewModal
        providerId={provider.id}
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
      />
    </motion.section>
  );
}
