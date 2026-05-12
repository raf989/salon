// Lightweight skeleton primitives. CSS-only animation (no framer-motion
// dependency) so they're cheap to render in lists.
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/**
 * Base skeleton block — a gray rectangle that pulses. Compose into shapes
 * via Tailwind classes.
 */
export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse bg-ink-100 rounded-md",
        className,
      )}
    />
  );
}

/**
 * Provider-row skeleton — matches the rough silhouette of
 * components/client/provider-row.tsx so the layout doesn't jump when real
 * data arrives.
 */
export function SkeletonProviderRow() {
  return (
    <div className="grid gap-4 p-3 md:grid-cols-[140px_1fr_180px] items-stretch border border-border rounded-2xl bg-surface">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-2 py-2 min-w-0">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/3 mt-auto pt-1" />
      </div>
      <div className="flex flex-col items-end justify-between py-2 gap-2 min-w-[170px]">
        <Skeleton className="h-6 w-20" />
        <div className="flex flex-col gap-2 w-full">
          <Skeleton className="h-8 w-full rounded-[10px]" />
          <Skeleton className="h-8 w-full rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Tender-card skeleton matching the featured card silhouette.
 */
export function SkeletonTenderCard() {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-6 md:p-7 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-3/4 mt-2" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <Skeleton className="h-10 w-40 mt-4 rounded-[10px]" />
    </div>
  );
}

/**
 * Compact tender-card skeleton for the grid below the featured one.
 */
export function SkeletonTenderCardCompact() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-[10px] mt-2" />
    </div>
  );
}

/**
 * Provider page skeleton — hero + gallery placeholders. Used while the
 * single-provider fetch is in flight so the page doesn't show a blank
 * white screen.
 */
export function SkeletonProviderPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8 min-w-0">
        {/* hero */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
        {/* gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
        {/* about + price list */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <aside className="space-y-4">
        <Skeleton className="h-96 w-full" />
      </aside>
    </div>
  );
}

/**
 * Dashboard skeleton: profile card + stats row + two-column body.
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="lg:col-span-2 h-[500px] rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-[500px] rounded-2xl" />
      </div>
    </div>
  );
}
