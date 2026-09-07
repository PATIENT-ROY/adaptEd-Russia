"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const AUTH_PATHS = ["/login", "/register", "/set-password"];
export const LAST_PATH_KEY = "adapted:lastPath";
export const CURRENT_PATH_KEY = "adapted:currentPath";

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getLastInAppPath() {
  if (typeof window === "undefined") return null;
  try {
    const last = sessionStorage.getItem(LAST_PATH_KEY);
    if (!last || last === window.location.pathname || isAuthPath(last)) return null;
    return last;
  } catch {
    return null;
  }
}

export function RememberPath() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || isAuthPath(pathname)) return;
    try {
      const previous = sessionStorage.getItem(CURRENT_PATH_KEY);
      if (previous && previous !== pathname) {
        sessionStorage.setItem(LAST_PATH_KEY, previous);
      }
      sessionStorage.setItem(CURRENT_PATH_KEY, pathname);
    } catch {
      // private mode
    }
  }, [pathname]);

  return null;
}
