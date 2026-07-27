"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useReducedMotion } from "framer-motion";

interface HeroTypewriterProps {
  slogans: string[];
}

export const HeroTypewriter = memo(function HeroTypewriter({
  slogans,
}: HeroTypewriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [animateDecor, setAnimateDecor] = useState(true);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [displayText, setDisplayText] = useState(slogans[0] ?? "");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateDecor(false), 12000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayText(slogans[0] ?? "");
      return;
    }
    if (!visible) return;

    const current = slogans[sloganIndex];

    if (phase === "typing") {
      if (displayText.length < current.length) {
        const timer = setTimeout(
          () => setDisplayText(current.slice(0, displayText.length + 1)),
          55 + Math.random() * 35,
        );
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => setPhase("pause"), 0);
      return () => clearTimeout(timer);
    }

    if (phase === "pause") {
      const timer = setTimeout(() => setPhase("deleting"), 2200);
      return () => clearTimeout(timer);
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        const timer = setTimeout(
          () => setDisplayText(current.slice(0, displayText.length - 1)),
          25,
        );
        return () => clearTimeout(timer);
      }
      setSloganIndex((prev) => (prev + 1) % slogans.length);
      setPhase("typing");
    }
  }, [displayText, phase, sloganIndex, slogans, visible, shouldReduceMotion]);

  useEffect(() => {
    setSloganIndex(0);
    setPhase("typing");
    setDisplayText(slogans[0] ?? "");
  }, [slogans]);

  const playState = visible && animateDecor && !shouldReduceMotion ? "running" : "paused";

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto px-4 mb-4 sm:mb-6 lg:mb-8">
      <div className="relative h-[64px] sm:h-[72px] md:h-[80px] lg:h-[52px] xl:h-[56px] rounded-xl sm:rounded-2xl border-none bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
        {!shouldReduceMotion && (
          <>
            <div
              className="absolute -left-2 top-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hero-float-center1"
              style={{ animationPlayState: playState }}
              aria-hidden
            />
            <div
              className="absolute left-[15%] -bottom-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 hero-float2"
              style={{ animationPlayState: playState }}
              aria-hidden
            />
            <div
              className="absolute right-[20%] -top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/15 hero-float3"
              style={{ animationPlayState: playState }}
              aria-hidden
            />
            <div
              className="absolute -right-1 top-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 hero-float-center2"
              style={{ animationPlayState: playState }}
              aria-hidden
            />
            <div
              className="absolute left-[40%] -bottom-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white/15 hero-float1"
              style={{ animationPlayState: playState }}
              aria-hidden
            />
          </>
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 lg:px-5 select-none">
          <span
            aria-hidden="true"
            className="shrink-0 text-xs sm:text-sm md:text-lg lg:text-xl text-white leading-none"
          >
            👉
          </span>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)] text-xs sm:text-sm md:text-lg lg:text-xl font-semibold text-center text-white leading-tight sm:leading-snug line-clamp-2 lg:line-clamp-none lg:whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          >
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
});
