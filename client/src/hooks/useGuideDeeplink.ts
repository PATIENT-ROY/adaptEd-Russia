"use client";

import { useEffect, useState } from "react";

function readQuery() {
  return new URLSearchParams(window.location.search).get("q")?.trim() || "";
}

function readHash() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

/** `?q=` заполняет поиск, `#hash` скроллит к блоку. */
export function useGuideDeeplink(searchSectionId: string) {
  const [urlQuery, setUrlQuery] = useState("");

  useEffect(() => {
    const q = readQuery();
    const hash = readHash();
    setUrlQuery(q);

    const targetId = q ? searchSectionId : hash;
    if (!targetId) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (q) {
        document.getElementById(`${searchSectionId}-input`)?.focus();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchSectionId]);

  return urlQuery;
}
