"use client";

// =============================================================================
// REVIEWS
//
// Per-provider review list: row mapper, fetch, read hook, and create
// mutation. The `rowToReview` mapper is colocated here because reviews are
// the only module that reads or writes the `reviews` table.
// =============================================================================

import { supabase } from "../supabase";
import type { CreateReviewInput, Review } from "@/lib/types";
import {
  asError,
  makeId,
  useAsync,
  useVersion,
  useVersions,
} from "./shared";

function rowToReview(row: {
  id: string;
  provider_id: string;
  author_name: string;
  rating: number;
  text: { az: string; ru: string };
  created_at: string;
}): Review {
  return {
    id: row.id,
    providerId: row.provider_id,
    authorName: row.author_name,
    rating: Number(row.rating),
    text: row.text,
    createdAt: row.created_at,
  };
}

async function fetchReviews(providerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw asError(error, "listReviews");
  return (data as Parameters<typeof rowToReview>[0][]).map(rowToReview);
}

export function useReviews(providerId: string | undefined): Review[] {
  const v = useVersion("reviews");
  return useAsync(
    () => (providerId ? fetchReviews(providerId) : Promise.resolve([])),
    [providerId, v],
    [] as Review[],
  );
}

export async function listReviews(providerId: string): Promise<Review[]> {
  return fetchReviews(providerId);
}

export async function createReview(
  providerId: string,
  input: CreateReviewInput,
): Promise<Review> {
  const row = {
    id: makeId("r"),
    provider_id: providerId,
    author_name: input.authorName,
    rating: input.rating,
    text: input.text,
    // Migration 011 requires non-null; the caller already gates the
    // form on a signed-in user, so this is always a real Firebase UID.
    auth_user_id: input.authUserId,
  };
  const { data, error } = await supabase
    .from("reviews")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createReview");
  useVersions.getState().bump("reviews");
  return rowToReview(data as Parameters<typeof rowToReview>[0]);
}
