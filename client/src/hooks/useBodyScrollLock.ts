"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;
let lastTouchY = 0;

function isInsideScrollable(target: EventTarget | null, deltaY: number) {
  let el = target instanceof HTMLElement ? target : null;

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScrollY =
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1;

    if (canScrollY) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
        return false;
      }
      return true;
    }

    el = el.parentElement;
  }

  return false;
}

function onWheel(event: WheelEvent) {
  if (isInsideScrollable(event.target, event.deltaY)) return;
  event.preventDefault();
}

function onTouchStart(event: TouchEvent) {
  lastTouchY = event.touches[0]?.clientY ?? 0;
}

function onTouchMove(event: TouchEvent) {
  const y = event.touches[0]?.clientY ?? 0;
  const deltaY = lastTouchY - y;
  lastTouchY = y;
  if (isInsideScrollable(event.target, deltaY)) return;
  event.preventDefault();
}

function lockScroll() {
  lockCount += 1;
  if (lockCount !== 1) return;

  const html = document.documentElement;
  const { body } = document;
  savedScrollY = window.scrollY;
  const gap = window.innerWidth - html.clientWidth;

  html.classList.add("body-scroll-locked");
  body.classList.add("body-scroll-locked");
  if (gap > 0) {
    html.style.setProperty("--scrollbar-gap", `${gap}px`);
    body.style.paddingRight = `${gap}px`;
  }

  document.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;

  const html = document.documentElement;
  const { body } = document;

  html.classList.remove("body-scroll-locked");
  body.classList.remove("body-scroll-locked");
  html.style.removeProperty("--scrollbar-gap");
  body.style.paddingRight = "";

  document.removeEventListener("wheel", onWheel);
  document.removeEventListener("touchstart", onTouchStart);
  document.removeEventListener("touchmove", onTouchMove);

  window.scrollTo(0, savedScrollY);
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockScroll();
    return () => unlockScroll();
  }, [locked]);
}
