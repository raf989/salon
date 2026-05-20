"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type Particle = {
  id: number;
  color: string;
  rot: number;
  rotEnd: number;
  vx: number;
  vy: number;
  delay: number;
};

const COLORS = ["#9B6CF6", "#FF3D9D", "#22D3EE", "#FFB000"];

function makeParticles(seed: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < 60; i++) {
    const id = seed * 1000 + i;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rot = Math.random() * 360;
    const rotEnd = rot + (Math.random() * 720 - 360);
    const vx = (Math.random() * 2 - 1) * 400;
    const vy = -(Math.random() * 400 + 200);
    out.push({ id, color, rot, rotEnd, vx, vy, delay: Math.random() * 0.08 });
  }
  return out;
}

export type ConfettiBurstProps = {
  trigger: boolean;
  onDone?: () => void;
  originX?: number;
  originY?: number;
};

export function ConfettiBurst({
  trigger,
  onDone,
  originX,
  originY,
}: ConfettiBurstProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const seedRef = useRef(0);
  const lastTrigger = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (trigger && !lastTrigger.current) {
      seedRef.current += 1;
      setActive(true);
      const t = window.setTimeout(() => {
        setActive(false);
        onDone?.();
      }, 2000);
      lastTrigger.current = true;
      return () => window.clearTimeout(t);
    }
    if (!trigger) lastTrigger.current = false;
  }, [trigger, onDone]);

  const particles = useMemo(
    () => (active ? makeParticles(seedRef.current) : []),
    [active],
  );

  if (!mounted) return null;

  const ox = originX ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const oy = originY ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0);

  const node = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <AnimatePresence>
        {active &&
          particles.map((p) => {
            // simulate gravity in a 2-keyframe x + 3-keyframe y curve
            const peakY = oy + p.vy * 0.6; // peak after partial upward travel
            const endY = oy + 800; // fall well below origin
            const endX = ox + p.vx;
            return (
              <motion.span
                key={p.id}
                initial={{
                  x: ox,
                  y: oy,
                  rotate: p.rot,
                  opacity: 1,
                }}
                animate={{
                  x: [ox, ox + p.vx * 0.5, endX],
                  y: [oy, peakY, endY],
                  rotate: p.rotEnd,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.6,
                  delay: p.delay,
                  ease: [0.16, 0.7, 0.5, 1],
                  times: [0, 0.4, 1],
                }}
                style={{
                  width: 8,
                  height: 4,
                  background: p.color,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  borderRadius: 1,
                  willChange: "transform, opacity",
                }}
              />
            );
          })}
      </AnimatePresence>
    </div>
  );

  return createPortal(node, document.body);
}

export function useConfetti(): [() => void, { trigger: boolean; onDone: () => void }] {
  const [trigger, setTrigger] = useState(false);
  const fire = useCallback(() => {
    setTrigger(false);
    // next tick flip to true so consecutive calls re-fire
    requestAnimationFrame(() => setTrigger(true));
  }, []);
  const onDone = useCallback(() => setTrigger(false), []);
  return [fire, { trigger, onDone }];
}
