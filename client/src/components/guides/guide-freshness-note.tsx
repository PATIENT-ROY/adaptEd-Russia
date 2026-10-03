"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function GuideFreshnessNote({
  section,
}: {
  section: "life" | "education";
}) {
  const { t } = useTranslation();
  const source = section === "life" ? "/life-guide" : "/education-guide";
  const href = `/support?${new URLSearchParams({
    category: "content-error",
    source,
  }).toString()}`;

  return (
    <aside
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 sm:py-5"
      aria-labelledby="guide-freshness-title"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2
            id="guide-freshness-title"
            className="text-base font-semibold text-slate-900"
          >
            {t("guides.freshness.title")}
          </h2>
          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
            <p>{t("guides.freshness.lead")}</p>
            <p>{t("guides.freshness.schedule")}</p>
            <p>{t("guides.freshness.sources")}</p>
            <p>{t("guides.freshness.experts")}</p>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            {t("guides.freshness.ctaPrompt")}{" "}
            <Link
              href={href}
              className="font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t("guides.freshness.cta")}
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}
