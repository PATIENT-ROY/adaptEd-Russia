"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getPayment } from "@/lib/api";
import { PaymentStatus } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const urlObj = new URL(url);

    let id = searchParams.get("payment_id");

    if (!id) {
      const pathMatch = url.match(/payment[^/]*\/payment\/test/);
      if (pathMatch) {
        id = urlObj.searchParams.get("payment_id");
      }
    }

    if (!id) {
      id = searchParams.get("paymentId") || searchParams.get("id");
    }

    if (id) {
      setPaymentId(id);
      checkPaymentStatus(id);
    } else {
      setError(t("payment.callback.noPaymentId"));
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkPaymentStatus = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const payment = await getPayment(id);
      setPaymentStatus(payment.status);

      if (payment.status === PaymentStatus.SUCCEEDED) {
        setTimeout(() => {
          router.push("/payment/test?payment_id=" + id);
        }, 2000);
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("payment.callback.checkError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status)
      return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;

    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELED:
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-blue-100 text-blue-800";

    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return "bg-green-100 text-green-800";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800";
      case PaymentStatus.CANCELED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return t("payment.callback.statusChecking");

    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return t("payment.callback.statusSucceeded");
      case PaymentStatus.FAILED:
        return t("payment.callback.statusFailed");
      case PaymentStatus.CANCELED:
        return t("payment.callback.statusCanceled");
      case PaymentStatus.PENDING:
        return t("payment.callback.statusPending");
      default:
        return status;
    }
  };

  const handleGoToTestPage = () => {
    if (paymentId) {
      router.push("/payment/test?payment_id=" + paymentId);
    } else {
      router.push("/payment/test");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                {t("payment.callback.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("payment.callback.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center justify-center">
                  {getStatusIcon(paymentStatus)}
                </div>

                {error && (
                  <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {paymentId && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t("payment.callback.paymentIdLabel")}:</span>
                      <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                        {paymentId}
                      </code>
                    </div>

                    {paymentStatus && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{t("payment.callback.statusLabel")}:</span>
                        <Badge className={getStatusColor(paymentStatus)}>
                          {getStatusLabel(paymentStatus)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {isLoading && !error && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      {t("payment.callback.checking")}
                    </p>
                  </div>
                )}

                {paymentStatus === PaymentStatus.SUCCEEDED && (
                  <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-center text-green-800">
                      {t("payment.callback.successMessage")}
                    </p>
                  </div>
                )}

                <div className="flex space-x-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/payment/test")}
                    className="flex-1"
                  >
                    {t("payment.callback.goToTestPage")}
                  </Button>
                  {paymentId && (
                    <Button
                      onClick={handleGoToTestPage}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {t("payment.callback.paymentDetails")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  {/* Static fallback — no t() in Suspense boundary */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
