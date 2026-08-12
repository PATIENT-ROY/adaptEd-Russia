"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Home,
  Globe2,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const ITEMS: {
  key: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    key: "home.section.adaptation.checklist.study",
    icon: BookOpen,
    tone: "bg-blue-100 text-blue-700",
  },
  {
    key: "home.section.adaptation.checklist.documents",
    icon: FileText,
    tone: "bg-violet-100 text-violet-700",
  },
  {
    key: "home.section.adaptation.checklist.dormitory",
    icon: Home,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "home.section.adaptation.checklist.life",
    icon: Globe2,
    tone: "bg-amber-100 text-amber-700",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function WaveDivider() {
  return (
    <svg
      className="mt-3 mb-5 w-full max-w-full text-indigo-400/70"
      viewBox="0 0 400 14"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 8c20-7 40 7 60 0s40 7 60 0 40 7 60 0 40 7 60 0 40 7 60 0 40 7 60 0 40 7 38 0"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function FadeIn({
  children,
  className,
  delay = 0,
  enabled,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const show = !enabled || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={
        show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.97 }
      }
      transition={{ duration: 0.5, ease, delay: show ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}

export function AdaptationHeroSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const enabled = ready && reduceMotion !== true;

  return (
    <section
      aria-label={t("home.section.adaptation.title")}
      className="below-fold relative my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
          <FadeIn enabled={enabled}>
            <div className="overflow-hidden rounded-[28px] sm:rounded-[32px] border border-slate-100 bg-[#f4f1fa] shadow-sm">
              <Image
                src="/images/illustration/adaptation-hero.png"
                alt={t("home.section.adaptation.title")}
                width={1536}
                height={1024}
                sizes="(max-width: 1024px) 92vw, 48vw"
                className="w-full h-auto object-contain object-center"
              />
            </div>
          </FadeIn>

          <div className="min-w-0 flex flex-col justify-center">
            <FadeIn enabled={enabled}>
              <div className="w-fit max-w-full">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {t("home.section.adaptation.title")}
                </h2>
                <WaveDivider />
              </div>
              <p className="mb-5 sm:mb-6 max-w-md text-sm sm:text-base text-slate-600 leading-relaxed">
                {t("home.section.adaptation.description")}
              </p>
            </FadeIn>

            <ul className="flex flex-col gap-2.5 sm:gap-3 m-0 p-0 list-none">
              {ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <FadeIn
                      enabled={enabled}
                      delay={0.06 + index * 0.07}
                      className="flex items-center gap-3 sm:gap-3.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]"
                    >
                      <span
                        className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full ${item.tone}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="flex-1 text-sm sm:text-base font-semibold text-slate-900">
                        {t(item.key)}
                      </span>
                    </FadeIn>
                  </li>
                );
              })}
            </ul>

            <FadeIn enabled={enabled} className="mt-6 sm:mt-8" delay={0.38}>
              <Link
                href="/life-guide"
                className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <Rocket className="h-5 w-5" aria-hidden />
                {t("home.section.adaptation.cta")}
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
