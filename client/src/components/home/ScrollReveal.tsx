"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUpVariants } from "@/components/home/home-motion";
import { useRevealInView } from "@/components/home/useRevealInView";

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
  const { ref, show } = useRevealInView();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      variants={fadeUpVariants}
      transition={{ delay }}
      className={["home-scroll-reveal", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.div>
  );
}
