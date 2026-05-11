"use client";

import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { CATEGORY_LABELS, type Stylist } from "@/lib/types";

export type ProfileCardProps = {
  me: Stylist;
};

type ChannelKind = "phone" | "whatsapp" | "instagram" | "tiktok";
type ContactItem = { kind: ChannelKind; value: string };
type ContactRow = [ContactItem | null, ContactItem | null];

/**
 * Pairing rules per the latest spec:
 *
 *  3 phones → [P1, WA] / [P2, IG] / [P3, TT]
 *  2 phones → [P1, IG] / [P2, TT] / [WA, _]
 *  1 phone  → [P1, IG] / [WA, TT]
 *  0 phones → fall back to a clean stack of whatever socials exist.
 *
 * Empty socials simply leave their cell blank — the grid keeps two equal
 * columns so the panel stays aligned.
 */
function buildContactRows(
  phones: string[],
  whatsapp?: string,
  instagram?: string,
  tiktok?: string,
): ContactRow[] {
  const cleanPhones = phones.filter((p) => p && p.trim());
  const phoneItem = (i: number): ContactItem | null =>
    cleanPhones[i] ? { kind: "phone", value: cleanPhones[i] } : null;
  const wa: ContactItem | null = whatsapp
    ? { kind: "whatsapp", value: whatsapp }
    : null;
  const ig: ContactItem | null = instagram
    ? { kind: "instagram", value: instagram }
    : null;
  const tt: ContactItem | null = tiktok
    ? { kind: "tiktok", value: tiktok }
    : null;

  const n = cleanPhones.length;

  if (n >= 3) {
    return [
      [phoneItem(0), wa],
      [phoneItem(1), ig],
      [phoneItem(2), tt],
    ];
  }
  if (n === 2) {
    const rows: ContactRow[] = [
      [phoneItem(0), ig],
      [phoneItem(1), tt],
    ];
    if (wa) rows.push([wa, null]);
    return rows;
  }
  if (n === 1) {
    const rows: ContactRow[] = [[phoneItem(0), ig]];
    if (wa || tt) rows.push([wa, tt]);
    return rows;
  }
  // 0 phones — list whatever socials exist, one per row.
  const rows: ContactRow[] = [];
  if (wa) rows.push([wa, null]);
  if (ig) rows.push([ig, null]);
  if (tt) rows.push([tt, null]);
  return rows;
}

export function ProfileCard({ me }: ProfileCardProps) {
  const { t, lang, pickLocalized } = useT();
  const firstName = me.name.split(" ")[0];
  const specialtiesLabel = me.specialties
    .map((s) => pickLocalized(CATEGORY_LABELS[s]))
    .join(" · ");
  const verifiedLabel = lang === "ru" ? "Подтверждён" : "Doğrulandı";

  const rows = buildContactRows(
    me.phones ?? [],
    me.whatsapp,
    me.instagram,
    me.tiktok,
  );
  const hasContacts = rows.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden p-7">
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-caspian-500 via-saffron-400 to-pomegranate-500"
        />

        {/* Edit button — anchored to the original top-right corner */}
        <div className="absolute top-4 right-4 z-10">
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              {t("dash.profile.goTo")}
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        {/* Three columns: identity · statuses (centered) · contacts (right).
            pt-12 keeps the absolutely-positioned edit button from overlapping. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center pt-12">
          {/* ── Col 1 — identity */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center min-w-0">
            <Avatar
              name={me.name}
              id={me.id}
              imageUrl={me.avatar}
              size="xl"
            />
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink-900 tracking-tight">
                {t("dash.greeting")}, {firstName}
              </h1>
              <p className="text-ink-500 text-sm mt-1">
                {pickLocalized(me.city)} · {specialtiesLabel}
              </p>
            </div>
          </div>

          {/* ── Col 2 — statuses, sitting closer to centre */}
          <div className="flex flex-col items-start gap-2 md:items-center md:text-center">
            <div className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-ink-50">
              <Star className="size-4 fill-saffron-400 text-saffron-400" />
              <span className="font-mono font-semibold text-ink-900">
                {me.rating}
              </span>
              <span className="text-xs text-ink-500">
                ({me.reviewsCount})
              </span>
            </div>
            <Badge variant="success-soft" pulse>
              {t("dash.openToday")}
            </Badge>
            {me.verified ? (
              <Badge variant="verified">
                <BadgeCheck className="size-3" />
                {verifiedLabel}
              </Badge>
            ) : null}
          </div>

          {/* ── Col 3 — contacts, flush right */}
          <div className="min-w-0 md:justify-self-end w-full md:max-w-sm">
            {hasContacts ? (
              <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 gap-x-4 gap-y-2 items-center"
                  >
                    {row[0] ? (
                      <ContactCell item={row[0]} />
                    ) : (
                      <span aria-hidden />
                    )}
                    {row[1] ? (
                      <ContactCell item={row[1]} />
                    ) : (
                      <span aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ContactCell({ item }: { item: ContactItem }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-700 min-w-0">
      <span
        aria-hidden
        className="size-7 grid place-items-center rounded-full bg-caspian-500/10 text-caspian-600 shrink-0"
      >
        {iconForKind(item.kind)}
      </span>
      <span className="font-mono truncate">{item.value}</span>
    </div>
  );
}

function iconForKind(kind: ChannelKind): ReactNode {
  switch (kind) {
    case "phone":
      return <Phone className="size-3.5" />;
    case "whatsapp":
      return <MessageCircle className="size-3.5" />;
    case "instagram":
      return <InstagramIcon />;
    case "tiktok":
      return <TikTokIcon />;
  }
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-3.5"
      aria-hidden
      {...props}
    >
      <path d="M19.6 7.7a5.7 5.7 0 0 1-3.7-1.4 5.6 5.6 0 0 1-1.8-3.1h-3v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V10a5.6 5.6 0 0 0-.8-.1 5.6 5.6 0 1 0 5.6 5.6V9.4a8.6 8.6 0 0 0 5.5 1.9V8.4c-0.3 0-.7-.1-1 .1V7.7Z" />
    </svg>
  );
}
