"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {featureName}
          </CardTitle>
          <p className="text-slate-600">{t("auth.preview.loginRequired")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-600" />
              {previewTitle}
            </p>
            <p className="text-sm text-slate-600">{previewText}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="w-full">
              <Button className="w-full">{t("login.submit")}</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button variant="outline" className="w-full">
                {t("auth.preview.createAccount")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
