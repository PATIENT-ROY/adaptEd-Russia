"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdaptationCta } from "@/hooks/useAdaptationCta";
import {
  glowPulse,
  premiumEase,
  scaleInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  viewportOnce,
} from "@/components/home/home-motion";

const CHECKLIST_KEYS = [
  "home.section.adaptation.checklist.study",
  "home.section.adaptation.checklist.documents",
  "home.section.adaptation.checklist.dormitory",
  "home.section.adaptation.checklist.life",
] as const;

export function AdaptationHeroSection() {
  const { t } = useTranslation();
  const { href, label } = useAdaptationCta();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-label={t("home.section.adaptation.title")}
      className="order-2 my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.08))] p-8 lg:p-20">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
          animate={shouldReduceMotion ? undefined : glowPulse}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-6 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  ...glowPulse,
                  transition: { ...glowPulse.transition, delay: 1.2 },
                }
          }
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-indigo-300/10 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0.35, 0.7, 0.35],
                  scale: [1, 1.12, 1],
                  transition: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
                }
          }
        />

        <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[40%_60%] lg:grid-cols-[45%_55%] lg:gap-12">
          <motion.div
            className="order-1 flex flex-col"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainerVariants}
          >
            <motion.div variants={staggerItemVariants}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight text-slate-900">
                {t("home.section.adaptation.title")}
              </h2>
              <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                {t("home.section.adaptation.description")}
              </p>
            </motion.div>

            <ul className="mt-6 space-y-3 sm:mt-8">
              {CHECKLIST_KEYS.map((key) => (
                <motion.li
                  key={key}
                  variants={staggerItemVariants}
                  className="flex items-center gap-3 text-base sm:text-lg font-medium text-slate-800"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  </span>
                  {t(key)}
                </motion.li>
              ))}
            </ul>

            <motion.div className="order-2 mt-8 md:order-none" variants={staggerItemVariants}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={href}
                  className="adaptation-hero-cta inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-colors duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {label}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="order-3 md:order-none flex justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={scaleInVariants}
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 4.8, repeat: Infinity, ease: premiumEase }
              }
            >
              <Image
                src="/images/illustration/image.png"
                alt={t("home.section.adaptation.title")}
                width={1095}
                height={1049}
                sizes="(max-width: 1024px) 90vw, 560px"
                className="h-[320px] w-full sm:h-[420px] md:h-[520px] lg:h-[580px] max-w-[560px] mx-auto object-contain"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
