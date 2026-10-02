"use client";
import { useReduce } from "./use-reduce";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

/** Card that tilts toward the pointer with a red light following it under the surface. */
export function SpotlightCard({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const reduce = useReduce();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const rx = useSpring(0, { stiffness: 200, damping: 18 });
  const ry = useSpring(0, { stiffness: 200, damping: 18 });
  const light = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, rgb(178 0 22 / 0.16), transparent 70%)`;
  const border = useMotionTemplate`radial-gradient(180px circle at ${mx}% ${my}%, rgb(178 0 22 / 0.9), transparent 70%)`;

  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        mx.set(px * 100);
        my.set(py * 100);
        if (!reduce) { rx.set((0.5 - py) * 14); ry.set((px - 0.5) * 14); }
      }}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
      className="group relative h-full rounded-card p-px"
    >
      <motion.div aria-hidden className="absolute inset-0 rounded-card opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: border }} />
      <Link href={href} className={`relative flex h-full flex-col overflow-hidden rounded-[15px] ${className ?? ""}`}>
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: light }} />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </Link>
    </motion.div>
  );
}
