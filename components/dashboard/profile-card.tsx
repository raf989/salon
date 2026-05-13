"use client";

import type { ReactNode } from "react";
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
import {
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { StatusControl } from "@/components/dashboard/status-control";
import { useProviderEditsRealtime } from "@/lib/api/repo";
import {
  instagramHref,
  telegramHref,
  tiktokHref,
  whatsappHref,
} from "@/lib/contact-urls";
import { useT } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/store";
import { CATEGORY_LABELS, type Stylist } from "@/lib/types";

export type ProfileCardProps = {
  me: Stylist;
};

type ChannelKind =
  | "phone"
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "tiktok";
type ContactItem = { kind: ChannelKind; value: string };
type ContactRow = [ContactItem | null, ContactItem | null];

/**
 * Build a flat list of all contact items in a stable order
 *   phones (up to 3) → whatsapp → telegram → instagram → tiktok
 * then fold into rows of two. Empty socials are simply omitted; the inner
 * 2-col grid keeps cells aligned even if the last row is half-empty.
 */
function buildContactRows(
  phones: string[],
  whatsapp?: string,
  telegram?: string,
  instagram?: string,
  tiktok?: string,
): ContactRow[] {
  const cells: ContactItem[] = [];
  phones
    .filter((p) => p && p.trim())
    .slice(0, 3)
    .forEach((p) => cells.push({ kind: "phone", value: p }));
  if (whatsapp) cells.push({ kind: "whatsapp", value: whatsapp });
  if (telegram) cells.push({ kind: "telegram", value: telegram });
  if (instagram) cells.push({ kind: "instagram", value: instagram });
  if (tiktok) cells.push({ kind: "tiktok", value: tiktok });

  const rows: ContactRow[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push([cells[i] ?? null, cells[i + 1] ?? null]);
  }
  return rows;
}

export function ProfileCard({ me }: ProfileCardProps) {
  const { t, lang, pickLocalized } = useT();
  useProviderEditsRealtime();

  // Greeting source priority: authenticated user → provider overlay → fallback.
  // The seeded providers.name (e.g. "Elvin Məmmədov") is intentionally NOT
  // used as a fallback for the greeting — that data belongs to demo rows,
  // not to whoever is logged in.
  const authUser = useCurrentUser();
  const fallbackName = lang === "ru" ? "пользователь" : "İstifadəçi";
  const trimmedAuth = (authUser?.name ?? "").trim();
  const firstName = trimmedAuth
    ? trimmedAuth.split(" ")[0]
    : fallbackName;
  const specialtiesLabel = me.specialties
    .map((s) => pickLocalized(CATEGORY_LABELS[s]))
    .join(" · ");
  const verifiedLabel = lang === "ru" ? "Подтверждён" : "Doğrulandı";

  // Show Telegram on the dashboard only when the provider has entered an
  // explicit handle. The phone-based deep link still works for the public
  // profile (`/provider/<slug>`); this pane is the user's own contact
  // overview so we want to display their actual username.
  const rows = buildContactRows(
    me.phones ?? [],
    me.whatsapp,
    me.telegram,
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
      <Card className="relative p-4 sm:p-7">
        {/* Without overflow-hidden the gradient bar must round its own top
            corners so it stays inside the card's rounded edges. */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[inherit] bg-gradient-to-r from-caspian-500 via-saffron-400 to-pomegranate-500"
        />

        {/* Edit button — stays in top-right corner, out of the flex flow.
            Slightly inset further on mobile so it can't graze the avatar. */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <Link href="/dashboard/profile" aria-label={t("dash.profile.goTo")}>
            <Button variant="outline" size="sm" className="min-h-11">
              <span className="hidden sm:inline">{t("dash.profile.goTo")}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        {/* Horizontal flow on lg+, vertical stack below.
            Pushed to lg so contacts have room — at md the 3-col packing
            compresses the contact column under the absolute edit button. */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-0 pt-12 sm:pt-14 lg:pt-12">
          {/* ── Block 1 — identity */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink-0">
            <Avatar
              name={trimmedAuth || me.name}
              id={authUser?.id ?? me.id}
              imageUrl={me.avatar}
              size="xl"
            />
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-ink-900 tracking-tight truncate">
                {t("dash.greeting")}, {firstName}
              </h1>
              <p className="text-ink-500 text-sm mt-1 truncate">
                {pickLocalized(me.city)} · {specialtiesLabel}
              </p>
            </div>
          </div>

          {/* ── Block 2 — statuses. Row layout on mobile so it doesn't
              stack into 3 tall lines; column on lg with ml-12. */}
          <div className="flex flex-row flex-wrap items-center gap-2 shrink-0 lg:flex-col lg:items-start lg:ml-12">
            <div className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-ink-50">
              <Star className="size-4 fill-saffron-400 text-saffron-400" />
              <span className="font-mono font-semibold text-ink-900">
                {me.rating}
              </span>
              <span className="text-xs text-ink-500">
                ({me.reviewsCount})
              </span>
            </div>
            <StatusControl provider={me} />
            {me.verified ? (
              <Badge variant="verified">
                <BadgeCheck className="size-3" />
                {verifiedLabel}
              </Badge>
            ) : null}
          </div>

          {/* ── Block 3 — contacts. Single column on mobile (prevents the
              icon+phone squeeze at 360px), 2-col from sm:, centred on lg.
              pr-44 only on lg+ where the edit button is in the same row. */}
          {hasContacts ? (
            <div className="min-w-0 lg:flex-1 lg:flex lg:justify-center lg:pl-10 lg:pr-44">
              <div className="w-full lg:max-w-md flex flex-col gap-2">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 items-center"
                  >
                    {row[0] ? (
                      <ContactCell item={row[0]} />
                    ) : (
                      <span aria-hidden className="hidden sm:block" />
                    )}
                    {row[1] ? (
                      <ContactCell item={row[1]} />
                    ) : (
                      <span aria-hidden className="hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

function ContactCell({ item }: { item: ContactItem }) {
  const href = hrefForItem(item);
  const inner = (
    <>
      <span
        aria-hidden
        className="size-7 grid place-items-center rounded-full bg-caspian-500/10 text-caspian-600 shrink-0"
      >
        {iconForKind(item.kind)}
      </span>
      <span className="font-mono truncate">{item.value}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-ink-700 min-w-0 hover:text-caspian-600 transition-colors"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-700 min-w-0">
      {inner}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// URL builders — users enter handles/numbers; we compose canonical URLs
// on display so the inputs stay simple.
// ─────────────────────────────────────────────────────────────────────
function hrefForItem(item: ContactItem): string | null {
  switch (item.kind) {
    case "whatsapp":
      return whatsappHref(item.value);
    case "telegram":
      return telegramHref(item.value);
    case "instagram":
      return instagramHref(item.value);
    case "tiktok":
      return tiktokHref(item.value);
    case "phone":
      // Phones stay non-clickable — change to `tel:` if it ever needs to dial.
      return null;
  }
}

function iconForKind(kind: ChannelKind): ReactNode {
  switch (kind) {
    case "phone":
      return <Phone className="size-3.5" />;
    case "whatsapp":
      return <MessageCircle className="size-3.5" />;
    case "telegram":
      return <TelegramIcon />;
    case "instagram":
      return <InstagramIcon />;
    case "tiktok":
      return <TikTokIcon />;
  }
}

