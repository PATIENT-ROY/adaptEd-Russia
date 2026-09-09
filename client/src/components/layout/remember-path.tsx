"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const AUTH_PATHS = ["/login", "/register", "/set-password", "/forgot-password"];
const STACK_KEY = "adapted:pathStack";
const MAX_STACK = 40;

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function pathOf(url: string) {
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

function sameLocation(a: string, b: string) {
  return a === b;
}

function currentLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.startsWith("/"));
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_STACK)));
}

function goTo(url: string) {
  const current = currentLocation();
  if (url === window.location.pathname || url === current) return;
  window.location.assign(url);
}

export function goBackInApp(fallbackHref = "/") {
  if (typeof window === "undefined") return;
  try {
    const current = currentLocation();
    const stack = readStack();
    while (stack.length > 0 && sameLocation(stack[stack.length - 1], current)) {
      stack.pop();
    }
    while (stack.length > 0 && isAuthPath(pathOf(stack[stack.length - 1]))) {
      stack.pop();
    }
    const target = stack[stack.length - 1] ?? fallbackHref;
    writeStack(stack);
    goTo(target);
  } catch {
    goTo(fallbackHref);
  }
}

export function RememberPath() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || isAuthPath(pathname)) return;
    try {
      const full = currentLocation();
      const stack = readStack();
      if (stack[stack.length - 1] !== full) {
        stack.push(full);
        writeStack(stack);
      }
    } catch {
      // private mode
    }
  }, [pathname]);

  return null;
}
