"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { createReview, useProvider, useReviews } from "@/lib/api/repo";
import { cn } from "@/lib/utils";

type Props = {
  providerId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function LeaveReviewModal({
  providerId,
  open,
  onClose,
  onSubmitted,
}: Props) {
  const { t } = useT();
  return (
    <Dialog open={open} onClose={onClose} title={t("reviews.leave")}>
      {/* Keyed inner form remounts on each open so prior input doesn't linger. */}
      <LeaveReviewForm
        key={open ? `open-${providerId}` : "closed"}
        providerId={providerId}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />
    </Dialog>
  );
}

function LeaveReviewForm({
  providerId,
  onClose,
  onSubmitted,
}: {
  providerId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const { t, lang } = useT();
  const currentUser = useCurrentUser();
  const provider = useProvider(providerId);
  const existingReviews = useReviews(providerId);

  const [authorName, setAuthorName] = useState<string>(
    currentUser?.name ?? "",
  );
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-abuse client-side checks. Server-side enforcement would need a
  // proper auth_user_id column on reviews — for the prototype these guards
  // are enough to prevent honest accidents and the most obvious self-review.
  const normalisedAuthor = authorName.trim().toLowerCase();
  const isSelfReview =
    !!provider &&
    normalisedAuthor === provider.name.trim().toLowerCase();
  const alreadyReviewed = existingReviews.some(
    (r) => r.authorName.trim().toLowerCase() === normalisedAuthor,
  );

  const validationMessage = (() => {
    if (isSelfReview) {
      return lang === "ru"
        ? "Нельзя оставить отзыв о себе."
        : "Özünüzə rəy yaza bilməzsiniz.";
    }
    if (alreadyReviewed) {
      return lang === "ru"
        ? "Вы уже оставляли отзыв этому исполнителю."
        : "Bu icraçıya artıq rəy yazmısınız.";
    }
    return null;
  })();

  const ready =
    authorName.trim().length > 0 &&
    text.trim().length >= 15 &&
    rating >= 1 &&
    rating <= 5 &&
    !isSelfReview &&
    !alreadyReviewed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createReview(providerId, {
        authorName: authorName.trim(),
        rating,
        text: { az: text.trim(), ru: text.trim() },
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto -mr-1 pr-1"
    >
        <div>
          <SectionLabel>{t("reviews.field.author")}</SectionLabel>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t("booking.namePlaceholder")}
            disabled={submitting}
          />
        </div>

        <div>
          <SectionLabel>{t("reviews.field.rating")}</SectionLabel>
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
        </div>

        <div>
          <SectionLabel>{t("reviews.field.text")}</SectionLabel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={submitting}
            className="w-full rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 transition-colors hover:border-ink-300 focus:outline-none focus:border-caspian-500 focus:shadow-[0_0_0_3px_rgba(15,133,126,0.25)] disabled:opacity-50 disabled:pointer-events-none resize-none"
          />
        </div>

        {validationMessage ? (
          <p className="text-sm text-pomegranate-500 leading-relaxed border border-pomegranate-200 bg-pomegranate-50 rounded-[10px] px-3 py-2">
            {validationMessage}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-pomegranate-500 leading-relaxed">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-1">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={submitting}
          >
            {t("booking.success.close")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!ready || submitting}
          >
            {submitting ? t("tenders.bid.submitting") : t("reviews.submit")}
          </Button>
        </div>
      </form>
  );
}

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div
      className="inline-flex gap-1"
      onMouseLeave={() => setHover(null)}
      aria-label={`${value} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          disabled={disabled}
          aria-label={`${n}`}
          aria-pressed={value === n}
          className={cn(
            "p-1 rounded-md transition-colors disabled:opacity-50",
            "hover:bg-ink-50 focus-visible:outline-none focus-visible:bg-ink-50",
          )}
        >
          <Star
            size={28}
            strokeWidth={0}
            className={
              n <= shown
                ? "fill-saffron-400 text-saffron-400"
                : "fill-ink-100 text-ink-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
      {children}
    </div>
  );
}
