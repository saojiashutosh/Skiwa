"use client";

import { motion, useReducedMotion } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  /** Per-word stagger in seconds. */
  stagger?: number;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/** Editorial word-by-word rise reveal for large headlines. */
export function TextReveal({
  text,
  className,
  stagger = 0.06,
  delay = 0,
  as: Tag = "h1",
}: TextRevealProps) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + index * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-hidden
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
