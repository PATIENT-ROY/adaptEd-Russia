"use client";

import Link from "next/link";
import { Ban, Shield, Trash2, AlertTriangle, MessageSquare, Users, KeyRound } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function SafetyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="mx-auto max-w-3xl pt-4 sm:pt-6">
        <BackButton
          label={t("safety.back")}
          fallbackHref={user ? "/profile" : "/"}
          className="mb-6"
        />

        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("safety.title")}
          </h1>
          <p className="mt-2 text-base text-slate-600">{t("safety.subtitle")}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{t("safety.intro")}</p>
        </div>

        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-red-950 sm:text-lg">
                <AlertTriangle className="h-5 w-5 text-red-700" />
                {t("safety.dont.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-red-950/90 sm:text-base">
                <li>{t("safety.dont.1")}</li>
                <li>{t("safety.dont.2")}</li>
                <li>{t("safety.dont.3")}</li>
                <li>{t("safety.dont.4")}</li>
                <li>{t("safety.dont.5")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                {t("safety.community.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-700 sm:text-base">
              {t("safety.community.text")}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-indigo-600" />
                {t("safety.buddy.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              <p>{t("safety.buddy.text")}</p>
              <Link
                href="/buddy"
                className="inline-flex font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
              >
                {t("safety.buddy.link")}
              </Link>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-amber-950">
                  <Ban className="h-5 w-5" />
                  {t("safety.consequences.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-amber-950/90">
                {t("safety.consequences.block")}
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Trash2 className="h-5 w-5" />
                  {t("safety.consequences.deleteTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-700">
                {t("safety.consequences.delete")}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <KeyRound className="h-5 w-5 text-slate-700" />
                {t("safety.hacked.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-700 sm:text-base">
              {t("safety.hacked.text")}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-5 w-5 text-emerald-600" />
                {t("safety.report.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                {t("safety.report.text")}
              </p>
              <Link
                href="/support"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700"
              >
                {t("safety.supportCta")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
