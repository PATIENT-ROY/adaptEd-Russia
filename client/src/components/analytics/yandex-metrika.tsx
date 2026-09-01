"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

export const YANDEX_METRIKA_ID = 112088911;
const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_CONSENT_EVENT = "cookie-consent-changed";

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

function isProductionDomain() {
  return ["adaptedrussia.ru", "www.adaptedrussia.ru"].includes(
    window.location.hostname,
  );
}

function YandexMetrikaInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const updateConsent = () => {
      if (!isProductionDomain()) {
        setEnabled(false);
        return;
      }
      // Track unless the visitor explicitly chose necessary-only.
      // Waiting for "accept" left the counter dead: banner ignored → 0 visits.
      setEnabled(localStorage.getItem(COOKIE_CONSENT_KEY) !== "necessary");
    };

    updateConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, updateConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, updateConsent);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window.ym !== "function") return;

    const url = window.location.href;
    if (previousUrl.current === null) {
      previousUrl.current = url;
      return;
    }
    if (previousUrl.current === url) return;

    window.ym(YANDEX_METRIKA_ID, "hit", url, {
      referer: previousUrl.current,
      title: document.title,
    });
    previousUrl.current = url;
  }, [enabled, pathname, searchParams]);

  if (!enabled) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}", "ym");
ym(${YANDEX_METRIKA_ID}, "init", {
  ssr: true,
  webvisor: false,
  clickmap: false,
  accurateTrackBounce: true,
  trackLinks: true
});
      `}
    </Script>
  );
}

export function YandexMetrika() {
  return (
    <Suspense fallback={null}>
      <YandexMetrikaInner />
    </Suspense>
  );
}
