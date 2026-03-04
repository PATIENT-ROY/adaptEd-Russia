"use client";

import { useState, useEffect, useRef, memo } from "react";

interface HeroTypewriterProps {
  slogans: string[];
}

export const HeroTypewriter = memo(function HeroTypewriter({
  slogans,
}: HeroTypewriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const current = slogans[sloganIndex];

    if (phase === "typing") {
      if (displayText.length < current.length) {
        const timer = setTimeout(
          () => setDisplayText(current.slice(0, displayText.length + 1)),
          55 + Math.random() * 35
        );
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase("pause"), 0);
        return () => clearTimeout(timer);
      }
    }

    if (phase === "pause") {
      const timer = setTimeout(() => setPhase("deleting"), 2200);
      return () => clearTimeout(timer);
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        const timer = setTimeout(
          () => setDisplayText(current.slice(0, displayText.length - 1)),
          25
        );
        return () => clearTimeout(timer);
      } else {
        setSloganIndex((prev) => (prev + 1) % slogans.length);
        setPhase("typing");
      }
    }
  }, [displayText, phase, sloganIndex, slogans, visible]);

  const playState = visible ? "running" : "paused";

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto px-4 mb-8 sm:mb-12">
      <div className="relative h-[44px] sm:h-[52px] md:h-[56px] rounded-2xl bg-white/15 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
        <div
          className="absolute -left-2 top-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hero-float-center1"
          style={{ animationPlayState: playState }}
        />
        <div
          className="absolute left-[15%] -bottom-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 hero-float2"
          style={{ animationPlayState: playState }}
        />
        <div
          className="absolute right-[20%] -top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/15 hero-float3"
          style={{ animationPlayState: playState }}
        />
        <div
          className="absolute -right-1 top-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 hero-float-center2"
          style={{ animationPlayState: playState }}
        />
        <div
          className="absolute left-[40%] -bottom-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white/15 hero-float1"
          style={{ animationPlayState: playState }}
        />

        <div className="absolute inset-0 flex items-center justify-center z-10 px-3">
          <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-semibold whitespace-nowrap text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            {displayText}
          </span>
          <span
            className="inline-block w-[2px] h-[1.1em] bg-white/90 rounded-full shrink-0 ml-0.5 hero-blink"
            style={{ animationPlayState: playState }}
          />
        </div>
      </div>
    </div>
  );
});
