"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Slide distance in px. */
  distance?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

/** Fade + slide reveal when the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  distance = 32,
  direction = "up",
  className,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  }[direction];

  const variants: Variants = {
    hidden: { opacity: 0, ...(reduceMotion ? {} : offset) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-64px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
