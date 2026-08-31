"use client";

import Link from "next/link";
import { Lock, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PREMIUM_CHECKOUT_PATH } from "@/constants/routes";

export function UsageBar({
  used,
  limit,
  plan,
  t,
}: {
  used: number;
  limit: number;
  plan: string;
  t: (key: string) => string;
}) {
  const percentage = Math.min((used / Math.max(limit, 1)) * 100, 100);
  const isLow = percentage >= 80;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{t("aiHelper.usage.title")}</span>
          </h3>
          <span className="text-xs font-medium text-gray-500">
            {plan === "FREEMIUM"
              ? t("home.pricing.freemium")
              : t("home.pricing.premium")}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isLow
                ? "bg-gradient-to-r from-red-400 to-red-500"
                : "bg-gradient-to-r from-blue-400 to-purple-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-gray-600">
          {t("aiHelper.usage.counter")
            .replace("{used}", String(used))
            .replace("{limit}", String(limit))}
        </p>

        {plan === "FREEMIUM" && (
          <Link
            href={PREMIUM_CHECKOUT_PATH}
            className="mt-3 flex items-center justify-center space-x-1.5 w-full px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-medium hover:from-amber-500 hover:to-orange-600 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("aiHelper.usage.upgrade")}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function LimitOverlay({
  plan,
  onDismiss,
  t,
}: {
  plan: string;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-6 rounded-2xl">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {t("aiHelper.limit.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {plan === "FREEMIUM"
            ? t("aiHelper.limit.freemiumDesc")
            : t("aiHelper.limit.premiumDesc")}
        </p>
        {plan === "FREEMIUM" && (
          <Link
            href={PREMIUM_CHECKOUT_PATH}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium hover:from-amber-500 hover:to-orange-600 transition-all mb-3"
          >
            <Sparkles className="h-4 w-4" />
            <span>{t("aiHelper.limit.upgrade")}</span>
          </Link>
        )}
        <div>
          <button
            onClick={onDismiss}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t("aiHelper.limit.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
