"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useReducedMotion } from "framer-motion";

interface HeroTypewriterProps {
  slogans: string[];
}

export const HeroTypewriter = memo(function HeroTypewriter({
  slogans,
}: HeroTypewriterProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
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

  return (
    <p
      ref={containerRef}
      className="mx-auto mb-4 max-w-3xl cursor-default select-none px-4 text-center sm:mb-6 lg:mb-8"
    >
      <span
        aria-live="polite"
        aria-atomic="true"
        className="text-sm font-medium leading-snug text-white/90 sm:text-base md:text-lg lg:text-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]"
      >
        {displayText}
      </span>
      {!shouldReduceMotion && (
        <span
          aria-hidden
          className="hero-blink ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] bg-white/80 align-middle"
        />
      )}
    </p>
  );
});
