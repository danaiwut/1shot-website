"use client";
import { useReduce } from "./use-reduce";
import { useRef } from "react";
import {
  motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap,
} from "motion/react";

/**
 * Endless strip of huge text. Scrolling speeds it up (and reverses it when you scroll back up),
 * and the faster you scroll the more it skews.
 */
export function VelocityMarquee({ items, baseSpeed = 3, className, outline = false }: { items: string[]; baseSpeed?: number; className?: string; outline?: boolean }) {
  const reduce = useReduce();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-6, 0, 6], { clamp: false });
  const skew = useTransform(velocity, [-2500, 0, 2500], [12, 0, -12]);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) dir.current = -1; else if (b > 0) dir.current = 1;
    x.set(wrap(-50, 0, x.get() - dir.current * baseSpeed * (delta / 1000) * (1 + Math.abs(b))));
  });
  const translate = useTransform(x, (v) => `${v}%`);
  const row = (
    <span className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-[0.35em]">
          <span className={outline && i % 2 ? "text-transparent [-webkit-text-stroke:1.5px_currentColor]" : ""}>{t}</span>
          <span className="inline-block size-[0.28em] rotate-45 bg-brand" />
        </span>
      ))}
    </span>
  );
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`} aria-hidden>
      <motion.div className="flex w-max" style={{ x: translate, skewX: reduce ? 0 : skew }}>
        {row}{row}
      </motion.div>
    </div>
  );
}
