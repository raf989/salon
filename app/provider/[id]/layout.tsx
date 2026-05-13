import { cache } from "react";
import type { Metadata } from "next";
import { getProvider, getProviderBySlug } from "@/lib/api/server";

// `react.cache()` memoizes the result across the whole request tree, so
// when generateMetadata and the page's data layer both reach for the same
// provider, Supabase is hit only once. The two fetchers are wrapped
// separately because `getProviderBySlug` returns null for a UUID-shaped
// param and we still want the UUID fallback to share its own cache.
const cachedBySlug = cache(getProviderBySlug);
const cachedById = cache(getProvider);

// `app/provider/[id]/page.tsx` is a Client Component (interactive booking
// state), so it can't host generateMetadata directly. This server-component
// layout wraps the page and runs the SEO fetch server-side so links shared
// in WhatsApp / Telegram preview correctly.
//
// The route param is still called `id` but its value is a slug. We try the
// slug-aware fetcher first and fall back to the id fetcher; whichever resolves
// first wins. Any throw collapses to base metadata so a Supabase outage
// doesn't break rendering.

const BASE_METADATA: Metadata = {
  // Empty object delegates to the root layout's metadata.
};

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let provider = null;
  try {
    // Prefer slug-aware lookup; if the helper itself or its inner slug query
    // hits an unexpected error, the catch below collapses to base metadata.
    provider = await cachedBySlug(id);
    if (!provider) {
      provider = await cachedById(id);
    }
  } catch {
    return BASE_METADATA;
  }

  if (!provider) {
    return { title: "Profil tapılmadı" };
  }

  const rawBio = provider.bio?.az || provider.bio?.ru || "";
  const description = rawBio ? truncate(rawBio, 160) : undefined;
  const title = provider.name;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "Vaxt",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
