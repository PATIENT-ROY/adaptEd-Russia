"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

function PaymentPathHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const paymentId =
      searchParams.get("payment_id") ||
      searchParams.get("paymentId") ||
      searchParams.get("id");

    if (paymentId) {
      router.replace(`/payment/callback?payment_id=${paymentId}`);
    } else {
      router.replace("/payment/test");
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t("payment.redirect.redirecting")}</p>
      </div>
    </div>
  );
}

export default function PaymentPathHandler() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      </div>
    }>
      <PaymentPathHandlerContent />
    </Suspense>
  );
}
