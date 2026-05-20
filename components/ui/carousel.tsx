"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselProps = {
  autoplay?: boolean;
  interval?: number;
  snap?: "start" | "center";
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  className?: string;
  itemClassName?: string;
  children: ReactNode;
};

export function Carousel({
  autoplay = false,
  interval = 5000,
  snap = "start",
  showDots = true,
  showArrows = false,
  loop = false,
  className,
  itemClassName,
  children,
}: CarouselProps) {
  const items = Children.toArray(children);
  const total = items.length;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLDivElement | null>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  // Measure item width and re-measure on resize.
  useLayoutEffect(() => {
    const measure = () => {
      if (firstItemRef.current) {
        const rect = firstItemRef.current.getBoundingClientRect();
        // gap-4 = 16px
        setItemWidth(rect.width + 16);
      }
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (firstItemRef.current) ro.observe(firstItemRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [total]);

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      if (loop) {
        setIndex(((next % total) + total) % total);
      } else {
        setIndex(Math.max(0, Math.min(total - 1, next)));
      }
    },
    [loop, total],
  );

  // Autoplay
  useEffect(() => {
    if (!autoplay || hovering || total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= total) return loop ? 0 : prev;
        return next;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [autoplay, hovering, interval, loop, total]);

  // Compute translation. For snap="center", offset by (container - item)/2.
  const centerOffset =
    snap === "center" && containerWidth && itemWidth
      ? (containerWidth - (itemWidth - 16)) / 2
      : 0;
  const x = -index * itemWidth + centerOffset;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (itemWidth === 0) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = itemWidth / 3;
    let delta = 0;
    if (offset < -threshold || velocity < -400) delta = 1;
    else if (offset > threshold || velocity > 400) delta = -1;
    goTo(index + delta);
  };

  const canGoPrev = loop || index > 0;
  const canGoNext = loop || index < total - 1;

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex gap-4 cursor-grab active:cursor-grabbing"
          animate={{ x }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
        >
          {items.map((child, i) => (
            <div
              key={i}
              ref={i === 0 ? firstItemRef : undefined}
              className={cn("shrink-0", itemClassName)}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {showArrows && total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => goTo(index - 1)}
            disabled={!canGoPrev}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "h-9 w-9 rounded-full glass-strong border border-border-strong",
              "flex items-center justify-center text-ink-700",
              "hover:text-ink-900 transition-opacity",
              !canGoPrev && "opacity-0 pointer-events-none",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => goTo(index + 1)}
            disabled={!canGoNext}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "h-9 w-9 rounded-full glass-strong border border-border-strong",
              "flex items-center justify-center text-ink-700",
              "hover:text-ink-900 transition-opacity",
              !canGoNext && "opacity-0 pointer-events-none",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      {showDots && total > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  active
                    ? "w-6 bg-magenta-500 glow-magenta"
                    : "w-1.5 bg-ink-300 hover:bg-ink-400",
                )}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
