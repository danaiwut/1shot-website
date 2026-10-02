"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const KEY = "1shot-intro-seen";

/** First visit of the session: black curtain with the mark, then it lifts away. Click to skip. */
export function IntroCurtain() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = true;
    try { seen = sessionStorage.getItem(KEY) === "1"; sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    if (!seen && !reduce) setShow(true);
  }, [reduce]);
  // Separate effect so a double-invoked mount (React strict mode) can't leave the curtain up.
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1900);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="presentation"
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[200] grid cursor-pointer place-items-center overflow-hidden bg-black"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1 origin-left bg-[#b20016]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
          />
          <div className="flex items-center gap-4">
            <motion.svg
              viewBox="0 0 32 32"
              className="size-16 sm:size-20"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              aria-hidden
            >
              <rect width="32" height="32" rx="8" fill="#b20016" />
              <motion.path
                d="M8 21.5 13 16.5l3.5 3.5L24 12"
                fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.45, ease: "easeInOut" }}
              />
              <motion.circle cx="24" cy="12" r="2.2" fill="#fff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }} />
            </motion.svg>
            <div className="overflow-hidden">
              <motion.p
                className="text-5xl font-bold tracking-tighter text-white sm:text-7xl"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                1SHOT<span className="text-[#ff4d61]">.</span>
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
