"use client";

import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { ReactNode } from "react";
import { fadeUpVariants, noMotionVariants } from "@/components/home/home-motion";
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
  const shouldReduceMotion = useMotionPreference();
  const { ref, show } = useRevealInView();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={shouldReduceMotion || show ? "visible" : "hidden"}
      variants={shouldReduceMotion ? noMotionVariants : fadeUpVariants}
      transition={{ delay: shouldReduceMotion ? 0 : delay }}
      className={["home-scroll-reveal", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.div>
  );
}
