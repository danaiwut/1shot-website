"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Red ring that trails the pointer and swells over anything clickable. Desktop pointers only. */
export function CursorRing() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHover(Boolean((e.target as Element | null)?.closest?.("a, button, label, [role=button], input, select")));
    };
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full border-2 border-[#b20016] mix-blend-difference"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hover ? 56 : 28, height: hover ? 56 : 28, scale: down ? 0.8 : 1, backgroundColor: hover ? "rgba(178,0,22,0.25)" : "rgba(178,0,22,0)" }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] size-1.5 rounded-full bg-[#b20016]"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
    </>
  );
}
