"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!start || hasAnimatedRef.current) return;

    const animate = () => {
      const startTime = performance.now();
      hasAnimatedRef.current = true;

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const nextValue = Math.min(end, end * easedProgress);

        setValue(nextValue);

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(step);
        } else {
          setValue(end);
        }
      };

      frameRef.current = window.requestAnimationFrame(step);
    };

    timeoutRef.current = window.setTimeout(animate, delay);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, duration, end, start]);

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
