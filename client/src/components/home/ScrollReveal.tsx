"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  fadeUpReducedVariants,
  fadeUpVariants,
  viewportOnce,
} from "@/components/home/home-motion";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={shouldReduceMotion ? fadeUpReducedVariants : fadeUpVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
