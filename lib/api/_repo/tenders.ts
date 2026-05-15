"use client";

// =============================================================================
// TENDERS + TENDER BIDS
//
// Couples `tenders` and `tender_bids` because a tender is always read with
// its bid list embedded. Mutations on either table bump the shared `tenders`
// version, so hooks refetch once and see consistent state.
// =============================================================================

import { useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import type {
  CreateBidInput,
  CreateTenderInput,
  Tender,
  TenderBid,
} from "@/lib/types";
import {
  asError,
  makeId,
  useAsync,
  useAsyncWithStatus,
  useVersion,
  useVersions,
} from "./shared";

// ---- row mappers ------------------------------------------------------------

export function rowToBid(row: {
  id: string;
  provider_id: string | null;
  author_user_id?: string | null;
  provider_name: string;
  provider_avatar?: string | null;
  price: number;
  note: { az: string; ru: string };
  badges: string[];
  rating: number | null;
  status?: string | null;
}): TenderBid {
  return {
    id: row.id,
    providerId: row.provider_id ?? "",
    authorUserId: row.author_user_id ?? undefined,
    providerName: row.provider_name,
    providerAvatar: row.provider_avatar ?? undefined,
    price: Number(row.price),
    note: row.note,
    badges: row.badges as TenderBid["badges"],
    rating: row.rating === null ? undefined : Number(row.rating),
    status: (row.status as TenderBid["status"]) ?? "pending",
  };
}

export function rowToTender(
  row: {
    id: string;
    tier: string;
    kind: string;
    title: { az: string; ru: string };
    description: { az: string; ru: string };
    budget_min: number;
    budget_max: number;
    deadline: string;
    opened_at: string;
    event_date?: string | null;
    event_time?: string | null;
    tags: { az: string; ru: string }[];
    author_name: string;
    auth_user_id?: string | null;
    district: { az: string; ru: string };
  },
  bids: TenderBid[],
): Tender {
  return {
    id: row.id,
    tier: row.tier as Tender["tier"],
    kind: row.kind as Tender["kind"],
    title: row.title,
    description: row.description,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    deadline: row.deadline,
    openedAt: row.opened_at,
    eventDate: row.event_date ?? undefined,
    eventTime: row.event_time ?? undefined,
    tags: row.tags,
    bidsCount: bids.length,
    bids,
    authorName: row.author_name,
    authUserId: row.auth_user_id ?? undefined,
    district: row.district,
  };
}

// ---- fetch ------------------------------------------------------------------

async function fetchTenders(): Promise<Tender[]> {
  const [tRes, bRes] = await Promise.all([
    supabase.from("tenders").select("*").order("opened_at", { ascending: false }),
    supabase.from("tender_bids").select("*"),
  ]);
  if (tRes.error) throw asError(tRes.error, "listTenders");
  if (bRes.error) throw asError(bRes.error, "listTenderBids");
  const bidsByTender = new Map<string, TenderBid[]>();
  for (const row of (bRes.data ?? []) as (Parameters<typeof rowToBid>[0] & {
    tender_id: string;
  })[]) {
    const list = bidsByTender.get(row.tender_id) ?? [];
    list.push(rowToBid(row));
    bidsByTender.set(row.tender_id, list);
  }
  return (tRes.data as Parameters<typeof rowToTender>[0][]).map((row) =>
    rowToTender(row, bidsByTender.get(row.id) ?? []),
  );
}

// ---- hooks ------------------------------------------------------------------

export function useTenders(): Tender[] {
  const v = useVersion("tenders");
  return useAsync(() => fetchTenders(), [v], [] as Tender[]);
}

/**
 * Same as `useTenders` but also surfaces a `loaded` flag for skeleton UX.
 */
export function useTendersWithStatus(): {
  tenders: Tender[];
  loaded: boolean;
} {
  const v = useVersion("tenders");
  const { data, loaded } = useAsyncWithStatus(
    () => fetchTenders(),
    [v],
    [] as Tender[],
  );
  return { tenders: data, loaded };
}

export function useTender(id: string | undefined): Tender | null {
  const tenders = useTenders();
  return useMemo(() => {
    if (!id) return null;
    return tenders.find((t) => t.id === id) ?? null;
  }, [id, tenders]);
}

export type MyBid = { bid: TenderBid; tender: Tender };

/**
 * All bids submitted by `authorUserId` paired with the parent tender. Uses
 * the existing `useTenders()` cache — no extra fetch.
 */
export function useMyBids(authorUserId: string | undefined): MyBid[] {
  const tenders = useTenders();
  return useMemo(() => {
    if (!authorUserId) return [];
    const out: MyBid[] = [];
    for (const tender of tenders) {
      for (const bid of tender.bids) {
        if (bid.authorUserId === authorUserId) {
          out.push({ bid, tender });
        }
      }
    }
    // Newest first — bid IDs are `b_<timestamp>_<rand>`, so reverse-lex sort
    // approximates insertion order.
    out.sort((a, b) => b.bid.id.localeCompare(a.bid.id));
    return out;
  }, [tenders, authorUserId]);
}

/**
 * Subscribe to any change on `tenders` or `tender_bids`. Both bump the
 * `tenders` version so `useTenders()` / `useTender()` refetch.
 */
export function useTendersRealtime(): void {
  useEffect(() => {
    const channel = supabase
      .channel("tenders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenders" },
        () => {
          useVersions.getState().bump("tenders");
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tender_bids" },
        () => {
          useVersions.getState().bump("tenders");
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}

// ---- imperative API ---------------------------------------------------------

export async function listTenders(): Promise<Tender[]> {
  return fetchTenders();
}

export async function getTender(id: string): Promise<Tender | null> {
  const list = await fetchTenders();
  return list.find((t) => t.id === id) ?? null;
}

export async function createTender(input: CreateTenderInput): Promise<Tender> {
  const row = {
    id: makeId("t"),
    tier: input.tier,
    kind: input.kind,
    title: input.title,
    description: input.description,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    deadline: input.deadline,
    opened_at: new Date().toISOString().slice(0, 10),
    event_date: input.eventDate ?? null,
    event_time: input.eventTime ?? null,
    tags: input.tags,
    author_name: input.authorName,
    auth_user_id: input.authUserId,
    district: input.district,
  };
  const { data, error } = await supabase
    .from("tenders")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createTender");
  useVersions.getState().bump("tenders");
  return rowToTender(data as Parameters<typeof rowToTender>[0], []);
}

export async function submitBid(
  tenderId: string,
  input: CreateBidInput,
): Promise<TenderBid> {
  // Pre-flight: refuse bids on past-deadline tenders and refuse duplicate
  // bids from the same auth user. RLS is demo-open so the only safety net
  // is here + a uniqueness constraint in migration 007. Both are needed:
  // the constraint catches a race, this check produces a friendly message.
  const { data: tenderRow, error: tenderErr } = await supabase
    .from("tenders")
    .select("deadline")
    .eq("id", tenderId)
    .maybeSingle();
  if (tenderErr) throw asError(tenderErr, "submitBid.lookup");
  if (!tenderRow) throw new Error("submitBid — tender not found");
  const todayISO = new Date().toISOString().slice(0, 10);
  if ((tenderRow.deadline as string) < todayISO) {
    throw new Error("submitBid — deadline passed");
  }
  if (input.authorUserId) {
    const { count, error: dupErr } = await supabase
      .from("tender_bids")
      .select("id", { count: "exact", head: true })
      .eq("tender_id", tenderId)
      .eq("author_user_id", input.authorUserId);
    if (dupErr) throw asError(dupErr, "submitBid.dupCheck");
    if ((count ?? 0) > 0) {
      throw new Error("submitBid — already bid on this tender");
    }
  }

  const row = {
    id: makeId("b"),
    tender_id: tenderId,
    provider_id: input.providerId || null,
    author_user_id: input.authorUserId ?? null,
    provider_name: input.providerName,
    provider_avatar: input.providerAvatar ?? null,
    price: input.price,
    note: input.note,
    badges: input.badges,
    rating: input.rating ?? null,
  };
  const { data, error } = await supabase
    .from("tender_bids")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "submitBid");
  useVersions.getState().bump("tenders");
  return rowToBid(data as Parameters<typeof rowToBid>[0]);
}

/**
 * Update an existing tender. Used by the author to fix typos / adjust
 * budget / push the event date. `opened_at` and `auth_user_id` are not
 * touched — those identify the post, not its mutable content.
 */
export async function updateTender(
  id: string,
  input: CreateTenderInput,
): Promise<Tender> {
  const patch = {
    tier: input.tier,
    kind: input.kind,
    title: input.title,
    description: input.description,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    deadline: input.deadline,
    event_date: input.eventDate ?? null,
    event_time: input.eventTime ?? null,
    tags: input.tags,
    author_name: input.authorName,
    district: input.district,
  };
  const { data, error } = await supabase
    .from("tenders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw asError(error, "updateTender");
  useVersions.getState().bump("tenders");
  return rowToTender(data as Parameters<typeof rowToTender>[0], []);
}

/**
 * Delete a tender. The `tender_bids` FK has `on delete cascade`, so all
 * its bids vanish with it. RLS (migration 011) restricts this to the
 * tender's author.
 */
export async function deleteTender(id: string): Promise<void> {
  const { error } = await supabase.from("tenders").delete().eq("id", id);
  if (error) throw asError(error, "deleteTender");
  useVersions.getState().bump("tenders");
}

/**
 * Delete a bid by id. The bidder uses this to retract a pending offer; the
 * tender author can also remove unwanted bids. RLS-wide for the prototype
 * — when real auth lands, restrict to `author_user_id = auth.uid()` or to
 * the parent tender's author.
 */
export async function deleteBid(bidId: string): Promise<void> {
  const { error } = await supabase
    .from("tender_bids")
    .delete()
    .eq("id", bidId);
  if (error) throw asError(error, "deleteBid");
  useVersions.getState().bump("tenders");
}

/**
 * Tender-author action: accept / reject a bid. `pending` lets the author
 * "un-decide" again without deleting.
 */
export async function updateBidStatus(
  bidId: string,
  status: "pending" | "accepted" | "rejected",
): Promise<void> {
  const { error } = await supabase
    .from("tender_bids")
    .update({ status })
    .eq("id", bidId);
  if (error) throw asError(error, "updateBidStatus");
  useVersions.getState().bump("tenders");
}
