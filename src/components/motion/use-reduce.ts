"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useMotionOff } from "./motion-pref";

/**
 * True when motion should stop: OS "reduce motion" or the site's pause switch.
 * False until mounted so server and first client render match.
 */
export function useReduce() {
  const os = useReducedMotion();
  const off = useMotionOff();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && (Boolean(os) || off);
}
