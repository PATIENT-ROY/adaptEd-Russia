"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { viewportOnce } from "@/components/home/home-motion";

/** Rescue only when the block is clearly on screen but IO never fired. */
function isStuckVisible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (r.width <= 0 || r.height <= 0) return false;
  const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  return visible / Math.min(r.height, vh) >= 0.45;
}

export function useRevealInView() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportOnce);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (inView) setShown(true);
  }, [inView]);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    let timer: number | undefined;
    const check = () => {
      window.clearTimeout(timer);
      if (!isStuckVisible(el)) return;
      timer = window.setTimeout(() => {
        if (isStuckVisible(el)) setShown(true);
      }, 450);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", check);
    };
  }, [shown]);

  return { ref, show: shown };
}
