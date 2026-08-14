"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CountUpProps {
  end: number;
  duration: number;
  decimals?: number;
  start?: boolean;
  delay?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  end,
  duration,
  decimals = 0,
  start = true,
  delay = 0,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const animatedEndRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const safeEnd = Number.isFinite(end) ? Math.max(0, end) : 0;
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0;

  useEffect(() => {
    if (shouldReduceMotion) {
      setValue(safeEnd);
      animatedEndRef.current = safeEnd;
      return;
    }

    if (!start || animatedEndRef.current === safeEnd) return;

    setValue(0);

    const animate = () => {
      const startTime = performance.now();
      animatedEndRef.current = safeEnd;

      if (safeDuration === 0) {
        setValue(safeEnd);
        return;
      }

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / safeDuration, 1);
        const easedProgress = easeOutCubic(progress);
        const nextValue = safeEnd * easedProgress;

        setValue(nextValue);

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(step);
        } else {
          setValue(safeEnd);
        }
      };

      frameRef.current = window.requestAnimationFrame(step);
    };

    timeoutRef.current = window.setTimeout(animate, safeDelay);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [safeDelay, safeDuration, safeEnd, shouldReduceMotion, start]);

  const formattedValue = useMemo(() => {
    const rounded =
      decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(rounded);
  }, [decimals, value]);

  return <>{formattedValue}</>;
}
