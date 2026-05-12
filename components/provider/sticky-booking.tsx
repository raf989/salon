"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, type DayState } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { useT } from "@/lib/i18n";
import { useAppointments, useServices } from "@/lib/api/repo";
import { generateSlots, isInBreak, toMinutes } from "@/lib/slots";
import type { Provider } from "@/lib/types";
import { formatDate, formatPrice, getDateISO, getTodayISO } from "@/lib/utils";

type Props = {
  provider: Provider;
  onOpenBooking: () => void;
};

const VISIBLE_WINDOW_DAYS = 60;

// Strip non-digits — WhatsApp's wa.me wants only digits, no `+` or spaces.
function whatsappHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function instagramHref(handle: string): string | null {
  const user = handle
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  return user ? `https://instagram.com/${encodeURIComponent(user)}` : null;
}

function tiktokHref(handle: string): string | null {
  const user = handle
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "")
    .replace(/\/+$/, "");
  return user ? `https://tiktok.com/@${encodeURIComponent(user)}` : null;
}

function telegramHref(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  // Accept both `@handle` and a phone number — telegram opens the chat by
  // either, as long as that number is registered with telegram.
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.length >= 10) {
    return digits ? `https://t.me/+${digits}` : null;
  }
  const user = raw
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
    .replace(/\/+$/, "");
  return user ? `https://t.me/${encodeURIComponent(user)}` : null;
}

export function StickyBooking({ provider, onOpenBooking }: Props) {
  const { t, lang, pickLocalized } = useT();
  const appointments = useAppointments({ stylistId: provider.id });
  const allServices = useServices();
  const todayISO = getTodayISO();

  const minPrice = useMemo(() => {
    const services = allServices.filter((s) =>
      provider.serviceIds.includes(s.id),
    );
    if (services.length === 0) return 0;
    return Math.min(...services.map((s) => s.price));
  }, [provider, allServices]);

  const windowSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < VISIBLE_WINDOW_DAYS; i++) {
      set.add(getDateISO(i));
    }
    return set;
  }, []);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayStateFn = useMemo<(iso: string) => DayState>(() => {
    const slots = generateSlots(
      provider.workingHours.start,
      provider.workingHours.end,
    );
    return (iso: string): DayState => {
      if (!windowSet.has(iso)) return "default";
      const isToday = iso === todayISO;
      const taken = new Set(
        appointments
          .filter(
            (a) =>
              a.stylistId === provider.id &&
              a.date === iso &&
              a.status !== "cancelled",
          )
          .map((a) => a.time),
      );
      const hasFree = slots.some((time) => {
        if (isInBreak(time, provider.breaks)) return false;
        if (taken.has(time)) return false;
        if (isToday && toMinutes(time) <= nowMinutes) return false;
        return true;
      });
      return hasFree ? "free" : "busy";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, appointments, todayISO, windowSet]);

  const availableToday = dayStateFn(todayISO) === "free";

  const initialDate = useMemo<string>(() => {
    if (dayStateFn(todayISO) === "free") return todayISO;
    for (let i = 1; i < VISIBLE_WINDOW_DAYS; i++) {
      const iso = getDateISO(i);
      if (dayStateFn(iso) === "free") return iso;
    }
    return todayISO;
  }, [dayStateFn, todayISO]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  const priceUnit = provider.priceUnit
    ? pickLocalized(provider.priceUnit)
    : lang === "ru"
      ? "час"
      : "saat";

  // Resolve real contact URLs once. wa.me accepts either the dedicated
  // `whatsapp` field or the first entry of `phones` — whichever is present.
  const waRaw = provider.whatsapp || provider.phones?.[0] || "";
  const waHref = waRaw ? whatsappHref(waRaw) : null;
  // Telegram falls back to the provider's phone — the same number that
  // already powers WhatsApp/calls — when no explicit handle is set.
  const tgRaw =
    provider.telegram || provider.whatsapp || provider.phones?.[0] || "";
  const tgHref = tgRaw ? telegramHref(tgRaw) : null;
  const igHref = provider.instagram ? instagramHref(provider.instagram) : null;
  const ttHref = provider.tiktok ? tiktokHref(provider.tiktok) : null;
  const hasAnyContact = Boolean(waHref || tgHref || igHref || ttHref);

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono font-semibold text-xl text-ink-900 leading-tight">
          {t("provider.priceFrom")} {formatPrice(minPrice)}{" "}
          <small className="text-sm font-normal text-ink-400">
            / {priceUnit}
          </small>
        </div>
        {availableToday ? (
          <Badge variant="success-soft" pulse>
            {t("provider.freeToday")}
          </Badge>
        ) : null}
      </div>

      <Calendar
        selected={selectedDate}
        onSelect={setSelectedDate}
        getDayState={dayStateFn}
        bare
        showLegend={false}
      />

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onOpenBooking}
      >
        {t("provider.bookOn").replace(
          "{date}",
          formatDate(selectedDate, lang),
        )}
      </Button>

      {hasAnyContact ? (
        <div className="grid grid-cols-2 gap-2">
          {waHref ? (
            <ContactLinkButton variant="whatsapp" href={waHref}>
              <MessageCircle size={16} /> {t("contact.whatsapp")}
            </ContactLinkButton>
          ) : null}
          {tgHref ? (
            <ContactLinkButton variant="telegram" href={tgHref}>
              <TelegramIcon className="size-4" /> {t("contact.telegram")}
            </ContactLinkButton>
          ) : null}
          {igHref ? (
            <ContactLinkButton variant="instagram" href={igHref}>
              <InstagramIcon className="size-4" /> Instagram
            </ContactLinkButton>
          ) : null}
          {ttHref ? (
            <ContactLinkButton variant="tiktok" href={ttHref}>
              <TikTokIcon className="size-4" /> TikTok
            </ContactLinkButton>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-ink-400 text-center">
        {t("provider.cancelFree")}
      </p>
    </Card>
  );
}

// Anchor styled like the existing Button so we keep the visual treatment for
// whatsapp/instagram/tiktok without forcing the Button primitive to grow an
// `asChild` API just for this case.
type ContactVariant = "whatsapp" | "telegram" | "instagram" | "tiktok";

const CONTACT_CLASSES: Record<ContactVariant, string> = {
  whatsapp:
    "bg-[#25D366] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1eb957]",
  telegram:
    "bg-[#229ED9] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1d8fc4]",
  // Instagram has no canonical solid brand colour; the gradient mirrors the
  // app's existing logo treatment elsewhere.
  instagram:
    "bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] to-[#bc1888] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:brightness-110",
  tiktok:
    "bg-ink-900 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-black",
};

function ContactLinkButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant: ContactVariant;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-tight transition-colors h-10 px-5 text-sm flex-1 whitespace-nowrap " +
        CONTACT_CLASSES[variant]
      }
    >
      {children}
    </a>
  );
}
