"use client";

import {
  useRef,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type TiltCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> & {
  children: ReactNode;
  max?: number;
  scale?: number;
  glare?: boolean;
  className?: string;
};

export function TiltCard({
  children,
  max = 12,
  scale = 1.02,
  glare = true,
  className,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sc = useMotionValue(1);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const srx = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.5 });
  const ssc = useSpring(sc, { stiffness: 220, damping: 22, mass: 0.5 });
  const sgx = useSpring(gx, { stiffness: 220, damping: 24, mass: 0.5 });
  const sgy = useSpring(gy, { stiffness: 220, damping: 24, mass: 0.5 });

  const glareBg = useTransform(
    [sgx, sgy],
    ([gxv, gyv]) =>
      `radial-gradient(circle at ${gxv}% ${gyv}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%)`,
  );

  const handleMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const nx = px * 2 - 1; // -1..1
      const ny = py * 2 - 1;
      ry.set(nx * max);
      rx.set(-ny * max);
      sc.set(scale);
      gx.set(px * 100);
      gy.set(py * 100);
    },
    [max, scale, rx, ry, sc, gx, gy],
  );

  const handleLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
    sc.set(1);
    gx.set(50);
    gy.set(50);
  }, [rx, ry, sc, gx, gy]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ perspective: 1000 }}
      className={cn("relative", className)}
      {...rest}
    >
      <motion.div
        style={{
          rotateX: srx,
          rotateY: sry,
          scale: ssc,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full w-full"
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            style={{ background: glareBg, mixBlendMode: "overlay" }}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        )}
      </motion.div>
    </div>
  );
}
