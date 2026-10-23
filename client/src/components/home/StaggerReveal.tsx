"use client";

import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { ReactNode } from "react";
import {
  staggerContainerVariants,
  staggerItemVariants,
  noMotionVariants,
} from "@/components/home/home-motion";
import { useRevealInView } from "@/components/home/useRevealInView";

type StaggerRevealProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerReveal({ children, className }: StaggerRevealProps) {
  const shouldReduceMotion = useMotionPreference();
  const { ref, show } = useRevealInView();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={shouldReduceMotion || show ? "visible" : "hidden"}
      variants={shouldReduceMotion ? noMotionVariants : staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  const shouldReduceMotion = useMotionPreference();

  return (
    <motion.div
      variants={shouldReduceMotion ? noMotionVariants : staggerItemVariants}
      className={["home-stagger-item", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.div>
  );
}
