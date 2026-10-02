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
            <motion.img
              src="/brand/logo.png"
              alt="1SHOT"
              className="h-24 w-auto sm:h-32"
              initial={{ clipPath: "inset(0 100% 0 0)", scale: 0.9, filter: "blur(8px)" }}
              animate={{ clipPath: "inset(0 0% 0 0)", scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
