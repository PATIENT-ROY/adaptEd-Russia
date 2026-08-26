"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Home,
  Globe2,
  Rocket,
  Check,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdaptationCta } from "@/hooks/useAdaptationCta";
import { useRevealInView } from "@/components/home/useRevealInView";

const ITEMS: {
  key: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    key: "home.section.adaptation.checklist.study",
    icon: BookOpen,
    iconClass: "text-blue-600",
  },
  {
    key: "home.section.adaptation.checklist.documents",
    icon: FileText,
    iconClass: "text-violet-600",
  },
  {
    key: "home.section.adaptation.checklist.dormitory",
    icon: Home,
    iconClass: "text-emerald-600",
  },
  {
    key: "home.section.adaptation.checklist.life",
    icon: Globe2,
    iconClass: "text-amber-600",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { ref, show } = useRevealInView();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={["home-fade-in", className].filter(Boolean).join(" ")}
      initial={{ opacity: 0, y: 18 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.55, ease, delay: show ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}

export function AdaptationHeroSection() {
  const { t } = useTranslation();
  const { href: adaptationCtaHref, label: adaptationCtaLabel } =
    useAdaptationCta();

  return (
    <section
      aria-label={t("home.section.adaptation.title")}
      className="home-adaptation-hero relative my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
          <FadeIn>
            <div className="overflow-hidden rounded-[28px] sm:rounded-[32px] border border-slate-100 bg-[#f4f1fa] shadow-sm">
              <Image
                src="/images/illustration/adaptation-hero.png?v=20260826"
                alt={t("home.section.adaptation.title")}
                width={1536}
                height={1024}
                sizes="(max-width: 1024px) 92vw, 48vw"
                className="w-full h-auto object-contain object-center"
              />
            </div>
          </FadeIn>

          <div className="min-w-0 flex flex-col justify-center">
            <FadeIn>
              <div className="w-fit max-w-full">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {t("home.section.adaptation.title")}
                </h2>
              </div>
              <p className="mt-3 mb-5 sm:mb-6 max-w-md text-sm sm:text-base text-slate-600 leading-relaxed">
                {t("home.section.adaptation.description")}
              </p>
            </FadeIn>

            <ul className="m-0 max-w-md cursor-default list-none divide-y divide-slate-200/80 p-0">
              {ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <FadeIn
                      delay={0.04 + index * 0.05}
                      className="flex items-center gap-3 py-2.5 sm:py-3"
                    >
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 border-emerald-500 bg-emerald-500 text-white"
                        aria-hidden
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <Icon
                        className={`h-4 w-4 shrink-0 ${item.iconClass}`}
                        aria-hidden
                      />
                      <span className="text-sm sm:text-base font-medium text-slate-800">
                        {t(item.key)}
                      </span>
                    </FadeIn>
                  </li>
                );
              })}
            </ul>

            <FadeIn className="mt-6 sm:mt-8" delay={0.24}>
              <Link
                href={adaptationCtaHref}
                className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:text-white"
              >
                <Rocket className="h-5 w-5" aria-hidden />
                {adaptationCtaLabel}
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
