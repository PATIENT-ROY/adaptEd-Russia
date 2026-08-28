"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
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
  Language,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  localizePlanName,
  localizePlanFeatures,
  localizePaymentDescription,
} from "@/lib/payment-i18n";

function getLocaleByLanguage(language?: Language): string {
  switch (language) {
    case Language.EN:
      return "en-US";
    case Language.FR:
      return "fr-FR";
    case Language.AR:
      return "ar";
    case Language.ZH:
      return "zh-CN";
    case Language.RU:
    default:
      return "ru-RU";
  }
}

function PaymentTestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const locale = getLocaleByLanguage(currentLanguage);
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [showConfirm, setShowConfirm] = useState(false);
  useBodyScrollLock(showConfirm);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const requestConfirm = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmCallback(() => onConfirm);
    setShowConfirm(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    }
  }, []);

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

      setPlans(plansData.filter((plan) => plan.price > 0));
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

    if (!isAuthenticated) {
      requestConfirm(t("payment.test.loginRequired"), () => {
        router.push("/login");
      });
      return;
    }

    setIsLoading(true);
    try {
      const payment = await createPayment({
        planId: selectedPlan.id,
        paymentMethod,
      });

      setCurrentPayment(payment);

      if (payment.confirmationUrl) {
        window.open(payment.confirmationUrl, "_blank");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        requestConfirm(t("payment.test.sessionExpired"), () => {
          router.push("/login");
        });
      } else {
        showToast(t("payment.test.createError"), "error");
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
          <BackButton
            label={t("support.back")}
            className="mb-4"
            onClick={() => router.push("/profile")}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("payment.test.title")}
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("payment.test.subtitle")}
            </p>
          </div>

          {/* Test Info Toggle */}
          {process.env.NODE_ENV !== "production" && (
            <div className="text-center mb-6">
              <Button
                variant="outline"
                onClick={() => setShowTestInfo(!showTestInfo)}
                className="flex items-center"
                disabled={!testData || isLoadingData}
              >
                <Info className="h-4 w-4 mr-2" />
                {isLoadingData
                  ? t("payment.test.loading")
                  : showTestInfo
                  ? t("payment.test.hideTestData")
                  : t("payment.test.showTestData")}
              </Button>
            </div>
          )}

          {/* Test Data */}
          {process.env.NODE_ENV !== "production" && showTestInfo && testData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  {t("payment.test.testDataTitle")}
                </CardTitle>
                <CardDescription>
                  {t("payment.test.testDataDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Test Cards */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t("payment.test.testCards")}
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
                      {t("payment.test.testSbp")}
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
                  <CardTitle>{t("payment.test.plansTitle")}</CardTitle>
                  <CardDescription>
                    {t("payment.test.plansDescription")}
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
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base sm:text-lg leading-snug">
                                {localizePlanName(plan, t)}
                              </h3>
                              <Badge variant="info" className="mt-1.5 w-fit">
                                {plan.interval === "MONTHLY"
                                  ? t("payment.test.intervalMonthly")
                                  : t("payment.test.intervalYearly")}
                              </Badge>
                            </div>
                            {selectedPlan?.id === plan.id && (
                              <div className="w-6 h-6 shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-3 whitespace-nowrap">
                            {plan.price}&nbsp;₽
                          </div>
                          <ul className="text-sm sm:text-[15px] text-gray-600 space-y-2">
                            {(() => {
                              const features = localizePlanFeatures(
                                plan.features,
                                t,
                                3,
                              );
                              if (features.length === 0) {
                                return (
                                  <li>{t("payment.test.featuresError")}</li>
                                );
                              }
                              return features.map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-start gap-2"
                                >
                                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                                  <span className="leading-snug">
                                    {feature}
                                  </span>
                                </li>
                              ));
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
                  <CardTitle>{t("payment.test.paymentMethod")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        method: PaymentMethod.CARD,
                        icon: CreditCard,
                        label: t("payment.test.methodCard"),
                      },
                      {
                        method: PaymentMethod.SBP,
                        icon: Smartphone,
                        label: t("payment.test.methodSbp"),
                      },
                      {
                        method: PaymentMethod.WALLET,
                        icon: Wallet,
                        label: t("payment.test.methodWallet"),
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
                        {t("payment.test.authRequired")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Selection status */}
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 min-w-0">
                      <div
                        className={`flex items-center gap-2 min-w-0 ${
                          selectedPlan ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 shrink-0 ${
                            selectedPlan ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className="leading-snug">
                          <span className="text-gray-500">
                            {t("payment.test.planLabel")}:{" "}
                          </span>
                          <span className="font-medium">
                            {selectedPlan
                              ? localizePlanName(selectedPlan, t)
                              : t("payment.test.notSelected")}
                          </span>
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 min-w-0 ${
                          paymentMethod ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 shrink-0 ${
                            paymentMethod ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className="leading-snug">
                          <span className="text-gray-500">
                            {t("payment.test.methodLabel")}:{" "}
                          </span>
                          <span className="font-medium">
                            {paymentMethod === PaymentMethod.CARD
                              ? t("payment.test.methodCardShort")
                              : paymentMethod === PaymentMethod.SBP
                              ? t("payment.test.methodSbpShort")
                              : t("payment.test.methodWalletShort")}
                          </span>
                        </span>
                      </div>
                    </div>
                    {selectedPlan && (
                      <div className="flex items-center gap-2 text-green-600 font-medium sm:shrink-0">
                        <CheckCircle className="h-4 w-4 shrink-0 sm:hidden" />
                        <span className="leading-snug">
                          {t("payment.test.readyToCreate")}
                        </span>
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
                      {t("payment.test.creating")}
                    </>
                  ) : selectedPlan ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("payment.test.createButton")}
                    </>
                  ) : (
                    t("payment.test.selectPlan")
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
                    <CardTitle>{t("payment.test.currentPayment")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t("payment.test.statusLabel")}:</span>
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
                        <span className="text-sm text-gray-600">{t("payment.test.amountLabel")}:</span>
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
                          {t("payment.test.goToPay")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckPayment}
                        className="w-full"
                      >
                        {t("payment.test.checkStatus")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Subscription */}
              {subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("payment.test.activeSubscription")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t("payment.test.planLabel")}:</span>
                        <span className="font-medium">
                          {subscription.plan
                            ? localizePlanName(subscription.plan, t)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t("payment.test.statusLabel")}:</span>
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
                        <span className="text-sm text-gray-600">{t("payment.test.untilLabel")}:</span>
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
                    <CardTitle>{t("payment.test.paymentHistory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {paymentHistory.slice(0, 5).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base leading-snug">
                              {localizePaymentDescription(
                                payment.description,
                                t,
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                              {new Date(payment.createdAt).toLocaleDateString(
                                locale,
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span className="font-semibold text-sm sm:text-base whitespace-nowrap">
                              {payment.amount}&nbsp;₽
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

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-[110] animate-in fade-in slide-in-from-top-4">
          <div
            className={`rounded-lg px-5 py-3 shadow-lg text-white text-sm font-medium ${
              toastType === "error"
                ? "bg-red-600"
                : toastType === "success"
                ? "bg-green-600"
                : "bg-blue-600"
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <p className="text-slate-800 mb-6">{confirmMessage}</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmCallback(null);
                }}
              >
                {t("payment.test.cancel")}
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  confirmCallback?.();
                  setConfirmCallback(null);
                }}
              >
                {t("payment.test.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function PaymentTestPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
          <h1 className="sr-only">Тарифы AdaptEd Russia</h1>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <PaymentTestContent />
    </Suspense>
  );
}
