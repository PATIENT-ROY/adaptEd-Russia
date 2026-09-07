"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Layout } from "@/components/layout/layout";

interface FeaturePreviewGateProps {
  featureName: string;
  previewTitle: string;
  previewText: string;
}

export function FeaturePreviewGate({
  featureName,
  previewTitle,
  previewText,
}: FeaturePreviewGateProps) {
  const { t } = useTranslation();
  const pathname = usePathname() || "/dashboard";
  const returnTo = encodeURIComponent(pathname);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-4">
        <BackButton label={t("templates.back")} fallbackHref="/" />
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {featureName}
            </CardTitle>
            <p className="text-slate-600">{t("auth.preview.loginRequired")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                {previewTitle}
              </p>
              <p className="text-sm text-slate-600">{previewText}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/login?returnTo=${returnTo}`} className="w-full">
                <Button className="w-full">{t("login.submit")}</Button>
              </Link>
              <Link href={`/register?returnTo=${returnTo}`} className="w-full">
                <Button variant="outline" className="w-full">
                  {t("auth.preview.createAccount")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
