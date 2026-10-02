"use client";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Pulls its child toward the pointer while hovered, then springs back. */
export function Magnetic({ children, strength = 0.35, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.3 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.3 });
  return (
    <motion.div
      className={className}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}
