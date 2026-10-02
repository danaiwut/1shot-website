"use client";
import { MotionConfig } from "motion/react";

/** Honour the OS "reduce motion" setting for every animation below. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
