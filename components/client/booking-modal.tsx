"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Palette,
  Scissors,
  Sparkles,
  User,
  Wind,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, type DayState } from "@/components/ui/calendar";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/ui/rating-stars";
import { TimeGrid } from "@/components/client/time-grid";
import {
  createAppointment,
  useAppointments,
  useServices,
} from "@/lib/api/repo";
import { generateSlots, isInBreak, isSlotPast, toMinutes } from "@/lib/slots";
import { telegramHref, whatsappHref } from "@/lib/contact-urls";
import {
  cn,
  formatDate,
  formatPrice,
  getDateISO,
  getTodayISO,
} from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import type {
  Lang,
  Localized,
  Service,
  ServiceCategory,
  Stylist,
} from "@/lib/types";
import { useT } from "@/lib/i18n";

type Props = {
  stylist: Stylist | null;
  open: boolean;
  onClose: () => void;
};

type Step = "select" | "success";

const VISIBLE_WINDOW_DAYS = 60;

const CATEGORY_ICONS: Partial<Record<ServiceCategory, typeof Scissors>> = {
  haircut: Scissors,
  beard: Scissors,
  coloring: Palette,
  styling: Wind,
};

export function BookingModal({ stylist, open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl">
      {stylist ? (
        <BookingFlow
          key={`${stylist.id}-${open ? "open" : "closed"}`}
          stylist={stylist}
          onClose={onClose}
        />
      ) : (
        <div />
      )}
    </Dialog>
  );
}

function BookingFlow({
  stylist,
  onClose,
}: {
  stylist: Stylist;
  onClose: () => void;
}) {
  const { t, lang, pickLocalized } = useT();
  const appointments = useAppointments();
  const allServices = useServices();
  const todayISO = getTodayISO();

  const services = useMemo<Service[]>(
    () => allServices.filter((s) => stylist.serviceIds.includes(s.id)),
    [stylist, allServices],
  );

  const [step, setStep] = useState<Step>("select");
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    () => stylist.serviceIds[0] ?? null,
  );
  const [clientName, setClientName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  // Surface backend failures from createAppointment so the user isn't stuck
  // watching the button read "Подтверждаем…" forever after e.g. a network
  // drop or RLS denial. Cleared whenever the user changes any selection.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedService =
    services.find((s) => s.id === selectedServiceId) ?? null;

  // Window of visible ISO dates: today through today + VISIBLE_WINDOW_DAYS - 1
  const windowSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < VISIBLE_WINDOW_DAYS; i++) {
      set.add(getDateISO(i));
    }
    return set;
  }, []);

  // Use the shared 30-second clock instead of `new Date()` at render time:
  // a long-open modal (browsing services) used to keep stale "free" slots
  // visible past their start time.
  const now = useNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayStateFn = useMemo<(iso: string) => DayState>(() => {
    const slotsForStylist = generateSlots(
      stylist.workingHours.start,
      stylist.workingHours.end,
    );
    return (iso: string): DayState => {
      if (!windowSet.has(iso)) return "default";
      const isToday = iso === todayISO;
      const taken = new Set(
        appointments
          .filter(
            (a) =>
              a.stylistId === stylist.id &&
              a.date === iso &&
              a.status !== "cancelled",
          )
          .map((a) => a.time),
      );
      const hasFree = slotsForStylist.some((time) => {
        if (isInBreak(time, stylist.breaks)) return false;
        if (taken.has(time)) return false;
        if (
          isToday &&
          isSlotPast(toMinutes(time), nowMinutes, stylist.workingHours.start)
        ) {
          return false;
        }
        return true;
      });
      return hasFree ? "free" : "busy";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylist, appointments, todayISO, windowSet, nowMinutes]);

  const availableToday = dayStateFn(todayISO) === "free";

  const ready =
    selectedTime !== null &&
    selectedServiceId !== null &&
    clientName.trim().length > 0;

  const errorLabel =
    lang === "ru" ? "Не получилось сохранить" : "Yadda saxlaya bilmədik";

  const handleConfirm = async () => {
    if (!ready || !selectedTime || !selectedServiceId || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createAppointment({
        stylistId: stylist.id,
        clientName: clientName.trim(),
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
      });
      setStep("success");
    } catch (err) {
      // Don't advance to success on failure — show inline error and let the
      // user retry. The optional-chained `.message` keeps us safe against
      // non-Error throws (Supabase sometimes throws plain objects).
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "";
      setErrorMsg(message ? `${errorLabel}: ${message}` : errorLabel);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  if (step === "success") {
    return (
      <SuccessView
        stylistName={stylist.name}
        whatsapp={stylist.whatsapp ?? stylist.phones?.[0]}
        telegram={stylist.telegram ?? stylist.phones?.[0]}
        date={selectedDate}
        time={selectedTime ?? ""}
        serviceName={selectedService?.name ?? null}
        servicePrice={selectedService?.price ?? 0}
        onClose={onClose}
        lang={lang}
      />
    );
  }

  const summary =
    selectedTime && selectedService
      ? `${formatDate(selectedDate, lang)} · ${selectedTime} · ${formatPrice(selectedService.price)}`
      : null;

  return (
    <div className="flex max-h-[78vh] flex-col overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={stylist.name} id={stylist.id} imageUrl={stylist.avatar} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-2xl text-ink-900 leading-tight truncate">
              {stylist.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-ink-500">
              <span>{pickLocalized(stylist.city)}</span>
              <span aria-hidden className="text-ink-300">
                ·
              </span>
              <RatingStars value={stylist.rating} size={14} />
              <span className="font-mono text-ink-700 font-medium">
                {stylist.rating.toFixed(1)}
              </span>
              <span className="text-ink-400">
                ({stylist.reviewsCount} {t("card.reviews")})
              </span>
            </div>
          </div>
        </div>
        {availableToday ? (
          <Badge variant="success-soft" pulse>
            {t("card.todayFree")}
          </Badge>
        ) : null}
      </div>

      {/* Body grid */}
      <div className="grid gap-6 md:grid-cols-5 mt-6">
        {/* Left: Calendar */}
        <div className="md:col-span-2">
          <SectionLabel>{t("booking.dateLabel")}</SectionLabel>
          <Calendar
            selected={selectedDate}
            getDayState={dayStateFn}
            onSelect={(iso) => {
              setSelectedDate(iso);
              setSelectedTime(null);
            }}
          />
        </div>

        {/* Right: services + time + name */}
        <div className="md:col-span-3 flex flex-col gap-5">
          {/* Service select */}
          <div>
            <SectionLabel>{t("booking.serviceLabel")}</SectionLabel>
            <div className="flex flex-col gap-2">
              {services.map((svc) => {
                const active = svc.id === selectedServiceId;
                const Icon = CATEGORY_ICONS[svc.category] ?? Sparkles;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setSelectedServiceId(svc.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-left",
                      active
                        ? "border-caspian-500 bg-caspian-50/50"
                        : "border-border hover:border-ink-300",
                    )}
                  >
                    <span className="h-9 w-9 rounded-lg bg-ink-50 grid place-items-center shrink-0 text-ink-700">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink-900 truncate">
                        {pickLocalized(svc.name)}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {svc.durationMin} {t("booking.minutes")}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-ink-900 shrink-0">
                      {formatPrice(svc.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time grid */}
          <div>
            <SectionLabel>{t("booking.timeLabel")}</SectionLabel>
            <TimeGrid
              stylist={stylist}
              date={selectedDate ?? todayISO}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
            />
          </div>

          {/* Client name */}
          <div>
            <SectionLabel>{t("booking.nameLabel")}</SectionLabel>
            <Input
              icon={<User />}
              placeholder={t("booking.namePlaceholder")}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              aria-label={t("booking.nameAria")}
            />
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
        {errorMsg ? (
          <p
            role="alert"
            className="text-sm font-medium text-danger-500"
          >
            {errorMsg}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          {summary ? (
            <span className="font-mono text-sm text-ink-600 truncate">
              {summary}
            </span>
          ) : (
            <span className="text-sm text-ink-400">
              {t("booking.pickPrompt")}
            </span>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={!ready || submitting}
            aria-label={t("booking.confirm")}
          >
            {submitting ? t("booking.confirming") : t("booking.confirm")}
          </Button>
        </div>
      </div>
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

function SuccessView({
  stylistName,
  whatsapp,
  telegram,
  date,
  time,
  serviceName,
  servicePrice,
  onClose,
  lang,
}: {
  stylistName: string;
  whatsapp?: string;
  telegram?: string;
  date: string;
  time: string;
  serviceName: Localized | null;
  servicePrice: number;
  onClose: () => void;
  lang: Lang;
}) {
  const { t, pickLocalized } = useT();
  const serviceLabel = serviceName ? pickLocalized(serviceName) : "";

  // Shared URL builders so all four "contact this provider" surfaces stay
  // identical (lib/contact-urls.ts).
  const waHref = whatsapp ? whatsappHref(whatsapp) : null;
  const tgHref = telegram ? telegramHref(telegram) : null;
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="grid place-items-center size-24 rounded-full bg-caspian-500/10 text-caspian-600"
      >
        <Check className="size-10" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.32 }}
        className="flex flex-col items-center gap-3"
      >
        <h3 className="font-display font-semibold text-3xl text-ink-900 leading-tight">
          {t("booking.success.title")}
        </h3>
        <p className="text-ink-500 max-w-sm font-mono text-sm">
          {stylistName} · {serviceLabel} · {formatDate(date, lang)} · {time} ·{" "}
          {formatPrice(servicePrice)}
        </p>
      </motion.div>

      <div className="flex gap-2 justify-center flex-wrap">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-tight transition-colors h-12 px-6 text-[15px] bg-[#25D366] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1eb957]"
          >
            {t("contact.whatsapp")}
          </a>
        ) : null}
        {tgHref ? (
          <a
            href={tgHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-tight transition-colors h-12 px-6 text-[15px] bg-[#229ED9] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.10)] hover:bg-[#1d8fc4]"
          >
            {t("contact.telegram")}
          </a>
        ) : null}
        <Button variant="ghost" size="lg" onClick={onClose}>
          {t("booking.success.close")}
        </Button>
      </div>
    </div>
  );
}
