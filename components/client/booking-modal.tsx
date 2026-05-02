"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TimeGrid } from "@/components/client/time-grid";
import { SERVICES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import {
  cn,
  formatAzDate,
  formatPrice,
  getDateISO,
  getTodayISO,
} from "@/lib/utils";
import type { Service, Stylist } from "@/lib/types";

type Props = {
  stylist: Stylist | null;
  open: boolean;
  onClose: () => void;
};

type Step = "select" | "success";

function buildDateChips(): string[] {
  return Array.from({ length: 7 }, (_, i) => getDateISO(i));
}

export function BookingModal({ stylist, open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Görüş təyin et"
      className="max-w-2xl"
    >
      {stylist ? (
        // key forces remount (and fresh state) per stylist + open cycle
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
  const addAppointment = useStore((s) => s.addAppointment);
  const todayISO = getTodayISO();

  const services = useMemo<Service[]>(
    () => SERVICES.filter((s) => stylist.serviceIds.includes(s.id)),
    [stylist],
  );

  const [step, setStep] = useState<Step>("select");
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    () => stylist.serviceIds[0] ?? null,
  );
  const [clientName, setClientName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const dateChips = buildDateChips();
  const selectedService =
    services.find((s) => s.id === selectedServiceId) ?? null;

  const canConfirm =
    selectedTime !== null &&
    selectedServiceId !== null &&
    clientName.trim().length > 0 &&
    !submitting;

  const handleConfirm = async () => {
    if (!canConfirm || !selectedTime || !selectedServiceId) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    addAppointment({
      id: crypto.randomUUID(),
      stylistId: stylist.id,
      clientName: clientName.trim(),
      serviceId: selectedServiceId,
      date: selectedDate,
      time: selectedTime,
      status: "upcoming",
    });
    setSubmitting(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <SuccessView
        stylistName={stylist.name}
        date={selectedDate}
        time={selectedTime ?? ""}
        serviceName={selectedService?.name ?? ""}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex max-h-[75vh] flex-col gap-5 overflow-y-auto pr-1">
      {/* Stylist mini-header */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <Image
            src={stylist.avatar}
            alt={stylist.name}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-50">
            {stylist.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
            <Star className="size-3 fill-[var(--accent)] text-[var(--accent)]" />
            <span className="text-neutral-200">
              {stylist.rating.toFixed(1)}
            </span>
            <span className="text-neutral-500">
              ({stylist.reviewsCount} rəy)
            </span>
          </div>
        </div>
      </div>

      {/* Date picker */}
      <div>
        <SectionLabel>Tarix seçin</SectionLabel>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dateChips.map((iso) => {
            const active = iso === selectedDate;
            const formatted = formatAzDate(iso);
            const [dayPart, weekdayPart] = formatted.split(", ");
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelectedDate(iso);
                  setSelectedTime(null);
                }}
                aria-pressed={active}
                className={cn(
                  "flex shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left transition-all duration-200",
                  active
                    ? "border-[var(--accent)]/45 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_4px_18px_-6px_rgba(212,165,116,0.45)]"
                    : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-neutral-100",
                )}
              >
                <span className="text-[11px] uppercase tracking-wide opacity-70">
                  {weekdayPart ?? ""}
                </span>
                <span className="text-xs font-medium">{dayPart}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service select */}
      <div>
        <SectionLabel>Xidmət seçin</SectionLabel>
        <div className="flex flex-col gap-2">
          {services.map((svc) => {
            const active = svc.id === selectedServiceId;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedServiceId(svc.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200",
                  active
                    ? "border-[var(--accent)]/45 bg-[var(--accent)]/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                )}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-sm font-medium",
                      active ? "text-neutral-50" : "text-neutral-200",
                    )}
                  >
                    {svc.name}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {svc.durationMin} dəq
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    active ? "text-[var(--accent)]" : "text-neutral-200",
                  )}
                >
                  {formatPrice(svc.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div>
        <SectionLabel>Vaxt seçin</SectionLabel>
        <TimeGrid
          stylist={stylist}
          date={selectedDate}
          selectedTime={selectedTime}
          onSelect={setSelectedTime}
        />
      </div>

      {/* Client name */}
      <div>
        <SectionLabel>Adınız</SectionLabel>
        <Input
          placeholder="Adınızı yazın"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          aria-label="Müştəri adı"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose}>
          Ləğv et
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          aria-label="Görüşü təsdiqlə"
        >
          {submitting ? "Göndərilir..." : "Görüşü təsdiqlə"}
        </Button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {children}
    </div>
  );
}

function SuccessView({
  stylistName,
  date,
  time,
  serviceName,
  onClose,
}: {
  stylistName: string;
  date: string;
  time: string;
  serviceName: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="flex size-20 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_8px_40px_-8px_rgba(212,165,116,0.6)]"
      >
        <Check className="size-10" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="flex flex-col items-center gap-2"
      >
        <h3 className="text-xl font-semibold tracking-tight text-neutral-50">
          Görüş təsdiqləndi!
        </h3>
        <p className="max-w-sm text-sm text-neutral-400">
          Görüşünüz uğurla qeydiyyata alındı. Aşağıda təfərrüatlar:
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm"
      >
        <SummaryRow label="Stilist" value={stylistName} />
        <SummaryRow label="Xidmət" value={serviceName} />
        <SummaryRow label="Tarix" value={formatAzDate(date)} />
        <SummaryRow label="Vaxt" value={time} />
      </motion.div>

      <Button onClick={onClose} className="w-full">
        Bağla
      </Button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="truncate text-sm font-medium text-neutral-100">
        {value}
      </span>
    </div>
  );
}
