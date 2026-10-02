"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** Like useReducedMotion, but false until mounted so server and first client render match. */
export function useReduce() {
  const pref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(pref);
}
