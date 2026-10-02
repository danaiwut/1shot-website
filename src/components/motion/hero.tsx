"use client";
import { useEffect, useRef, useState } from "react";
import {
  animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform,
} from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Headline whose words rise out of a mask one by one. Lines arrive pre-split into Thai words
 * (Intl.Segmenter on the server), so client and server render the same markup.
 * The accent line gets a red bar that wipes across before the text turns red.
 */
export function HeroHeadline({ lines, accent, className }: { lines: string[][]; accent: string[]; className?: string }) {
  let i = 0;
  const word = (w: string, key: string, extra = "") => {
    const d = 0.25 + i++ * 0.06;
    return (
      <span key={key} className="-mt-[0.35em] inline-block overflow-hidden pt-[0.35em] pb-[0.14em] align-bottom">
        <motion.span
          className={`inline-block ${extra}`}
          initial={{ y: "105%", rotate: 6, filter: "blur(10px)" }}
          animate={{ y: 0, rotate: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease, delay: d }}
        >
          {w}
        </motion.span>
      </span>
    );
  };
  const accentDelay = 0.25 + lines.flat().length * 0.06;
  return (
    <h1 className={className}>
      {lines.map((ws, l) => (
        <span key={l} className="block">{ws.map((w, j) => word(w, `${l}-${j}`))}</span>
      ))}
      <span className="relative inline-block">
        {accent.map((w, j) => word(w, `a-${j}`, "text-accent"))}
        <motion.span
          aria-hidden
          className="absolute inset-x-[-0.05em] inset-y-[0.08em] rounded-md bg-brand"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
          transition={{ duration: 1.1, times: [0, 0.45, 0.55, 1], ease: "easeInOut", delay: accentDelay - 0.15 }}
        />
      </span>
      <motion.span className="inline-block" initial={{ opacity: 0, scale: 3 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: accentDelay + 0.7 }}>.</motion.span>
    </h1>
  );
}

/** Fades the rest of the hero copy in after the headline. */
export function HeroFade({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay }}>
      {children}
    </motion.div>
  );
}

/** Red light that follows the pointer across the hero. */
export function Spotlight() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(70);
  const y = useMotionValue(30);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });
  const bg = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgb(178 0 22 / 0.45), transparent 65%)`;

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || reduce) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width) * 100);
      y.set(((e.clientY - r.top) / r.height) * 100);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [reduce, x, y]);

  return <motion.div ref={ref} aria-hidden className="pointer-events-none absolute inset-0" style={{ background: bg }} />;
}

/** 3D stage: children tilt toward the pointer; layers with data-depth float at different distances. */
export function TiltStage({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-22, 10]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      px.set(Math.max(-0.5, Math.min(0.5, (e.clientX - (r.left + r.width / 2)) / window.innerWidth)));
      py.set(Math.max(-0.5, Math.min(0.5, (e.clientY - (r.top + r.height / 2)) / window.innerHeight)));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, px, py]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, rotateY: -60, rotateX: 25, scale: 0.8, y: 80 }}
      animate={{ opacity: 1, rotateY: 0, rotateX: 0, scale: 1, y: 0 }}
      transition={{ duration: 1.4, ease, delay: 0.5 }}
      style={{ perspective: 1600 }}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative">
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Layer inside TiltStage at a given depth (px toward the viewer). */
export function Depth({ z, children, className }: { z: number; children: React.ReactNode; className?: string }) {
  return <div className={className} style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}>{children}</div>;
}

/** Illustrative price that wanders and flashes green/red. Not market data. */
export function PriceTicker({ start }: { start: number }) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(start);
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setP((v) => {
        const next = Math.round((v + (Math.random() - 0.48) * 1.6) * 100) / 100;
        setDir(next >= v ? 1 : -1);
        return Math.min(start + 18, Math.max(start - 7, next));
      });
    }, 1100);
    return () => clearInterval(t);
  }, [reduce, start]);
  return (
    <motion.span
      key={p}
      initial={{ backgroundColor: dir === 1 ? "rgba(52,199,154,.35)" : dir === -1 ? "rgba(255,77,97,.35)" : "rgba(0,0,0,0)" }}
      animate={{ backgroundColor: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.9 }}
      className={`num rounded px-1 ${dir === 1 ? "text-buy" : dir === -1 ? "text-sell" : ""}`}
    >
      {p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </motion.span>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, reduce, to]);
  return <span ref={ref} className={className}>{v}</span>;
}
