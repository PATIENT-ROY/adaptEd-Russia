import type { Variants } from "framer-motion";

export const premiumEase = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = {
  once: true,
  margin: "-72px" as const,
  amount: 0.18 as const,
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: premiumEase },
  },
};

export const fadeUpReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35 },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: premiumEase },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: premiumEase },
  },
};

export const floatLoop = {
  y: [0, -10, 0],
  transition: {
    duration: 4.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const planeLoop = {
  x: [0, 18, 0],
  y: [0, -8, 0],
  transition: {
    duration: 5.5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const glowPulse = {
  opacity: [0.45, 0.85, 0.45],
  scale: [1, 1.08, 1],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};
