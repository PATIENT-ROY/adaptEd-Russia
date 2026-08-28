"use client";

import Link from "next/link";
import { ArrowRight, Bot, Check, FileText, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { useTranslation } from "@/hooks/useTranslation";

export default function AiHelperLandingPage() {
  const { t } = useTranslation();
  const fallback = (
    <FeaturePreviewGate
      featureName={t("aiLanding.preview.feature")}
      previewTitle={t("aiLanding.preview.title")}
      previewText={t("aiLanding.preview.text")}
    />
  );

  return (
    <ProtectedRoute fallback={fallback}>
      <Layout>
        <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
          <header className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200/70 sm:h-14 sm:w-14">
                <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("aiLanding.title")}</h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">{t("aiLanding.subtitle")}</p>
              </div>
            </div>
          </header>

          <div className="grid auto-rows-fr items-stretch gap-4 sm:gap-5 md:grid-cols-2">
            <Link href="/ai-helper/assistant" className="group flex h-full min-h-[32rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-lg sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Bot className="h-6 w-6" /></div>
              <h2 className="mt-4 flex min-h-14 items-start text-xl font-bold text-slate-900 sm:text-2xl">{t("aiLanding.assistant.title")}</h2>
              <p className="mt-2 min-h-28 text-sm leading-relaxed text-slate-600 sm:text-base">{t("aiLanding.assistant.desc")}</p>
              <div className="mt-5 min-h-20 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" />{t("aiLanding.assistant.item1")}</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" />{t("aiLanding.assistant.item2")}</p>
              </div>
              <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">{t("aiLanding.assistant.cta")} <ArrowRight className="h-4 w-4" /></span>
            </Link>

            <Link href="/ai-helper/tools" className="group flex h-full min-h-[32rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-lg sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"><FileText className="h-6 w-6" /></div>
              <h2 className="mt-4 flex min-h-14 items-start text-xl font-bold text-slate-900 sm:text-2xl">{t("aiLanding.tools.title")}</h2>
              <p className="mt-2 min-h-28 text-sm leading-relaxed text-slate-600 sm:text-base">{t("aiLanding.tools.desc")}</p>
              <div className="mt-5 min-h-20 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-500" />{t("aiLanding.tools.item1")}</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-500" />{t("aiLanding.tools.item2")}</p>
              </div>
              <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-purple-700">{t("aiLanding.tools.cta")} <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
