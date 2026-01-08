"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  TestTube,
  Info,
  Check,
} from "lucide-react";
import {
  getSubscriptionPlans,
  createPayment,
  getPayment,
  getTestData,
  getSubscription,
  getPaymentHistory,
} from "@/lib/api";
import {
  SubscriptionPlan,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
  TestData,
  Payment,
  Subscription,
  PaymentResponse,
} from "@/types";

function PaymentTestContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CARD
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<
    (PaymentResponse & { status?: string }) | Payment | null
  >(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [showTestInfo, setShowTestInfo] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Проверяем авторизацию только на клиенте
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      console.log("Token found:", !!token, "Token value:", token);
      setIsAuthenticated(!!token);
    }
  }, []);

  // Обработка payment_id из URL (когда пользователь переходит с callback страницы)
  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (paymentId && !currentPayment) {
      loadPaymentById(paymentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);

      // Загружаем данные параллельно, но обрабатываем ошибки отдельно
      const [plansData, testDataResponse, subscriptionData, historyData] =
        await Promise.all([
          getSubscriptionPlans().catch((error) => {
            console.error("Error loading subscription plans:", error);
            return [] as SubscriptionPlan[];
          }),
          getTestData().catch((error) => {
            console.error("Error loading test data:", error);
            return null as TestData | null;
          }),
          getSubscription().catch((error) => {
            console.error("Error loading subscription:", error);
            return null as Subscription | null;
          }),
          getPaymentHistory().catch((error) => {
            console.error("Error loading payment history:", error);
            return [] as Payment[];
          }),
        ]);

      setPlans(plansData);
      setTestData(testDataResponse);
      setSubscription(subscriptionData);
      setPaymentHistory(historyData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan) return;

    console.log("handleCreatePayment - isAuthenticated:", isAuthenticated);
    console.log(
      "handleCreatePayment - localStorage token:",
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : "no window"
    );

    // Проверяем авторизацию
    if (!isAuthenticated) {
      const shouldLogin = confirm(
        "Для создания платежа необходимо войти в систему. Перейти на страницу входа?"
      );
      if (shouldLogin) {
        window.location.href = "/login";
      }
      return;
    }

    setIsLoading(true);
    try {
      const payment = await createPayment({
        planId: selectedPlan.id,
        paymentMethod,
      });

      setCurrentPayment(payment);

      // Если есть URL для подтверждения, открываем его
      if (payment.confirmationUrl) {
        window.open(payment.confirmationUrl, "_blank");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        const shouldLogin = confirm(
          "Сессия истекла. Перейти на страницу входа?"
        );
        if (shouldLogin) {
          window.location.href = "/login";
        }
      } else {
        alert("Ошибка при создании платежа. Попробуйте еще раз.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentId = (payment: PaymentResponse | Payment | null) => {
    if (!payment) return null;
    return "paymentId" in payment ? payment.paymentId : payment.id;
  };

  const getPaymentStatus = (payment: PaymentResponse | Payment | null) => {
    if (!payment) return null;
    return "status" in payment ? payment.status : null;
  };

  const getPaymentAmount = (payment: PaymentResponse | Payment | null) => {
    if (!payment) return null;
    if ("amount" in payment && typeof payment.amount === "object") {
      return payment.amount.value;
    }
    return payment.amount?.toString();
  };

  const getConfirmationUrl = (payment: PaymentResponse | Payment | null) => {
    if (!payment) return null;
    return "confirmationUrl" in payment ? payment.confirmationUrl : null;
  };

  const loadPaymentById = async (paymentId: string) => {
    try {
      setIsLoading(true);
      const payment = await getPayment(paymentId);
      setCurrentPayment(payment);

      // Если платеж успешен, обновляем данные
      if (payment.status === PaymentStatus.SUCCEEDED) {
        await loadData();
      }
    } catch (error) {
      console.error("Error loading payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    const paymentId = getPaymentId(currentPayment);
    if (!paymentId) return;

    try {
      const payment = await getPayment(paymentId);
      setCurrentPayment(payment);

      // Если платеж успешен, обновляем данные
      if (payment.status === PaymentStatus.SUCCEEDED) {
        await loadData();
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatus.FAILED:
        return <XCircle className="h-4 w-4" />;
      case PaymentStatus.CANCELED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Тестирование платежей
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Тестовая среда для проверки интеграции с YooKassa. Все платежи
              безопасны и не списывают реальные деньги.
            </p>
          </div>

          {/* Test Info Toggle */}
          <div className="text-center mb-6">
            <Button
              variant="outline"
              onClick={() => setShowTestInfo(!showTestInfo)}
              className="flex items-center"
              disabled={!testData || isLoadingData}
            >
              <Info className="h-4 w-4 mr-2" />
              {isLoadingData
                ? "Загрузка..."
                : showTestInfo
                ? "Скрыть"
                : "Показать"}{" "}
              тестовые данные
            </Button>
          </div>

          {/* Test Data */}
          {showTestInfo && testData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Тестовые данные
                </CardTitle>
                <CardDescription>
                  Используйте эти данные для тестирования различных сценариев
                  платежей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Test Cards */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Тестовые карты
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(testData.testCards).map(([key, card]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium text-sm">{key}</div>
                            <div className="text-xs text-gray-600">
                              {
                                testData.instructions.cards[
                                  key.toLowerCase() as keyof typeof testData.instructions.cards
                                ]
                              }
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-white px-2 py-1 rounded">
                              {card}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(card)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test SBP */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Тестовые СБП номера
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(testData.testSbpPhones).map(
                        ([key, phone]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">{key}</div>
                              <div className="text-xs text-gray-600">
                                {
                                  testData.instructions.sbp[
                                    key.toLowerCase() as keyof typeof testData.instructions.sbp
                                  ]
                                }
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-white px-2 py-1 rounded">
                                {phone}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(phone)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription Plans */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Планы подписок</CardTitle>
                  <CardDescription>
                    Выберите план для тестирования платежа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all relative ${
                          selectedPlan?.id === plan.id
                            ? "ring-2 ring-blue-500 bg-blue-50 shadow-lg"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <CardContent className="p-4">
                          {/* Selection indicator */}
                          {selectedPlan?.id === plan.id && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{plan.name}</h3>
                            <Badge variant="info">
                              {plan.interval === "MONTHLY" ? "Месяц" : "Год"}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {plan.price} ₽
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {(() => {
                              try {
                                const features = JSON.parse(plan.features);
                                return features
                                  .slice(0, 3)
                                  .map((feature: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-center"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                                      {feature}
                                    </li>
                                  ));
                              } catch {
                                return <li>Ошибка загрузки функций</li>;
                              }
                            })()}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Способ оплаты</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        method: PaymentMethod.CARD,
                        icon: CreditCard,
                        label: "Банковская карта",
                      },
                      {
                        method: PaymentMethod.SBP,
                        icon: Smartphone,
                        label: "СБП",
                      },
                      {
                        method: PaymentMethod.WALLET,
                        icon: Wallet,
                        label: "Электронный кошелек",
                      },
                    ].map(({ method, icon: Icon, label }) => (
                      <Card
                        key={method}
                        className={`cursor-pointer transition-all relative ${
                          paymentMethod === method
                            ? "ring-2 ring-blue-500 bg-blue-50 shadow-lg"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setPaymentMethod(method)}
                      >
                        <CardContent className="p-4 text-center">
                          {/* Selection indicator */}
                          {paymentMethod === method && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                          <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="font-medium">{label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Create Payment Button */}
              <div className="mt-6">
                {!isAuthenticated && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <Info className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Для создания платежей необходимо войти в систему
                      </span>
                    </div>
                  </div>
                )}

                {/* Selection status */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center ${
                          selectedPlan ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 mr-1 ${
                            selectedPlan ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span>
                          План: {selectedPlan ? selectedPlan.name : "Не выбран"}
                        </span>
                      </div>
                      <div
                        className={`flex items-center ${
                          paymentMethod ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 mr-1 ${
                            paymentMethod ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span>
                          Способ:{" "}
                          {paymentMethod === PaymentMethod.CARD
                            ? "Карта"
                            : paymentMethod === PaymentMethod.SBP
                            ? "СБП"
                            : "Кошелек"}
                        </span>
                      </div>
                    </div>
                    {selectedPlan && (
                      <div className="text-green-600 font-medium">
                        Готово к созданию платежа
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleCreatePayment}
                  disabled={!selectedPlan || isLoading}
                  className={`w-full ${
                    selectedPlan
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400"
                  }`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Создание платежа...
                    </>
                  ) : selectedPlan ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Создать тестовый платеж
                    </>
                  ) : (
                    "Выберите план подписки"
                  )}
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <div className="space-y-6">
              {/* Current Payment Status */}
              {currentPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Текущий платеж</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Статус:</span>
                        <Badge
                          className={getStatusColor(
                            getPaymentStatus(currentPayment) || ""
                          )}
                        >
                          <div className="flex items-center">
                            {getStatusIcon(
                              getPaymentStatus(currentPayment) || ""
                            )}
                            <span className="ml-1">
                              {getPaymentStatus(currentPayment)}
                            </span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Сумма:</span>
                        <span className="font-medium">
                          {getPaymentAmount(currentPayment)} ₽
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">ID:</span>
                        <code className="text-xs">
                          {getPaymentId(currentPayment)}
                        </code>
                      </div>
                      {getConfirmationUrl(currentPayment) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              getConfirmationUrl(currentPayment)!,
                              "_blank"
                            )
                          }
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Перейти к оплате
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckPayment}
                        className="w-full"
                      >
                        Проверить статус
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Subscription */}
              {subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle>Активная подписка</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">План:</span>
                        <span className="font-medium">
                          {subscription.plan?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Статус:</span>
                        <Badge
                          className={
                            subscription.status === SubscriptionStatus.ACTIVE
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">До:</span>
                        <span className="font-medium">
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>История платежей</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {paymentHistory.slice(0, 5).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {payment.description}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {payment.amount} ₽
                            </span>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusIcon(payment.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function PaymentTestPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка...</p>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <PaymentTestContent />
    </Suspense>
  );
}
