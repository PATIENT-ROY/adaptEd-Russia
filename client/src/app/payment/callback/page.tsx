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

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем payment_id из URL
    // URL может быть: /payment/callback?payment_id=... или /payment/.../payment/test?payment_id=...
    const url = typeof window !== "undefined" ? window.location.href : "";
    const urlObj = new URL(url);

    // Пытаемся получить payment_id из query параметров
    let id = searchParams.get("payment_id");

    // Если payment_id нет в query, пытаемся извлечь из пути
    if (!id) {
      // Обработка URL вида: /payment/127.0.4.240:56548/payment/test?payment_id=...
      const pathMatch = url.match(/payment[^/]*\/payment\/test/);
      if (pathMatch) {
        id = urlObj.searchParams.get("payment_id");
      }
    }

    // Также проверяем альтернативные имена параметров
    if (!id) {
      id = searchParams.get("paymentId") || searchParams.get("id");
    }

    if (id) {
      setPaymentId(id);
      checkPaymentStatus(id);
    } else {
      setError("Не найден идентификатор платежа");
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

      // Если платеж успешен, перенаправляем на страницу тестирования через 2 секунды
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
          : "Не удалось проверить статус платежа"
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
    if (!status) return "Проверка...";

    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return "Успешно";
      case PaymentStatus.FAILED:
        return "Неудачно";
      case PaymentStatus.CANCELED:
        return "Отменен";
      case PaymentStatus.PENDING:
        return "В обработке";
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
                Обработка платежа
              </CardTitle>
              <CardDescription className="text-center">
                Проверка статуса платежа...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Иконка статуса */}
                <div className="flex items-center justify-center">
                  {getStatusIcon(paymentStatus)}
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                  <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Информация о платеже */}
                {paymentId && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">ID платежа:</span>
                      <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                        {paymentId}
                      </code>
                    </div>

                    {paymentStatus && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Статус:</span>
                        <Badge className={getStatusColor(paymentStatus)}>
                          {getStatusLabel(paymentStatus)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Индикатор загрузки */}
                {isLoading && !error && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Проверка статуса платежа...
                    </p>
                  </div>
                )}

                {/* Сообщение об успехе */}
                {paymentStatus === PaymentStatus.SUCCEEDED && (
                  <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-center text-green-800">
                      Платеж успешно обработан! Вы будете перенаправлены...
                    </p>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex space-x-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/payment/test")}
                    className="flex-1"
                  >
                    На страницу тестирования
                  </Button>
                  {paymentId && (
                    <Button
                      onClick={handleGoToTestPage}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Подробнее о платеже
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
                  Обработка платежа
                </CardTitle>
                <CardDescription className="text-center">
                  Загрузка...
                </CardDescription>
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
