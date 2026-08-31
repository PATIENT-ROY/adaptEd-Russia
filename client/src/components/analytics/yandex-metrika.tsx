"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const COUNTER_ID = 112088911;
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
  const [ready, setReady] = useState(false);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const updateConsent = () => {
      setEnabled(
        isProductionDomain() &&
          localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted",
      );
    };

    updateConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, updateConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, updateConsent);
  }, []);

  const trackPageView = useCallback(() => {
    if (!window.ym) return;

    const url = window.location.href;
    if (previousUrl.current === url) return;

    window.ym(COUNTER_ID, "hit", url, {
      referer: previousUrl.current ?? document.referrer,
      title: document.title,
    });
    previousUrl.current = url;
  }, []);

  useEffect(() => {
    if (!enabled || !ready) return;
    trackPageView();
  }, [enabled, pathname, ready, searchParams, trackPageView]);

  if (!enabled) return null;

  return (
    <Script
      id="yandex-metrika"
      src={`https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`}
      strategy="afterInteractive"
      onLoad={() => {
        window.ym?.(COUNTER_ID, "init", {
          defer: true,
          ssr: true,
          accurateTrackBounce: true,
          webvisor: false,
          clickmap: false,
          trackLinks: false,
        });
        setReady(true);
      }}
    />
  );
}

export function YandexMetrika() {
  return (
    <Suspense fallback={null}>
      <YandexMetrikaInner />
    </Suspense>
  );
}
