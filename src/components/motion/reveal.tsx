"use client";
import { motion, type HTMLMotionProps, type Variants } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ delay = 0, y = 28, className, children, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -35, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", transition: { duration: 0.9, ease } },
};

/** Grid/list whose items flip up one after another. */
export function Stagger({ className, children, as = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "ol" | "ul" }) {
  const Tag = motion[as];
  return (
    <Tag variants={list} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10% 0px" }} className={className} style={{ perspective: 1200 }}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ className, children, as = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "li" }) {
  const Tag = motion[as];
  return <Tag variants={item} className={className} style={{ transformOrigin: "50% 100%" }}>{children}</Tag>;
}
