"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentAdaptationIllustration } from "@/components/home/StudentAdaptationIllustration";

const CHECKLIST_KEYS = [
  "home.section.adaptation.checklist.study",
  "home.section.adaptation.checklist.documents",
  "home.section.adaptation.checklist.dormitory",
  "home.section.adaptation.checklist.life",
] as const;

const CHECKLIST_DELAYS = [100, 150, 200, 250];

export function AdaptationHeroSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || isVisible) return;

    const reveal = () => setIsVisible(true);

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "80px 0px" },
    );

    observer.observe(node);

    const fallbackTimer = window.setTimeout(reveal, 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      aria-label={t("home.section.adaptation.title")}
      className="order-2 my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.08))] p-8 lg:p-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-6 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-indigo-300/10 blur-3xl"
        />

        <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[40%_60%] lg:grid-cols-[45%_55%] lg:gap-12">
          <div className="order-1 flex flex-col">
            <div
              className={`adaptation-hero-text ${isVisible ? "is-visible" : ""}`}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight text-slate-900">
                {t("home.section.adaptation.title")}
              </h2>
              <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                {t("home.section.adaptation.description")}
              </p>
            </div>

            <ul className="mt-6 space-y-3 sm:mt-8">
              {CHECKLIST_KEYS.map((key, index) => (
                <li
                  key={key}
                  className={`adaptation-hero-check flex items-center gap-3 text-base sm:text-lg font-medium text-slate-800 ${
                    isVisible ? "is-visible" : ""
                  }`}
                  style={{ transitionDelay: `${CHECKLIST_DELAYS[index]}ms` }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="order-2 mt-8 md:order-none">
              <Link
                href="/register"
                className="adaptation-hero-cta inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t("home.start")}
              </Link>
            </div>
          </div>

          <div
            className={`adaptation-hero-illustration order-3 md:order-none flex justify-center ${
              isVisible ? "is-visible" : ""
            }`}
          >
            <StudentAdaptationIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
