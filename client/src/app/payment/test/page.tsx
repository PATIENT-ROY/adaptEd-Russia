"use client";

import { useState, useEffect, Suspense } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";

function PaymentTestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("payment.test.title")}
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("payment.test.subtitle")}
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
                ? t("payment.test.loading")
                : showTestInfo
                ? t("payment.test.hideTestData")
                : t("payment.test.showTestData")}
            </Button>
          </div>

          {/* Test Data */}
          {showTestInfo && testData && (
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
                        <CardContent className="p-4">
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
                              {plan.interval === "MONTHLY"
                                ? t("payment.test.intervalMonthly")
                                : t("payment.test.intervalYearly")}
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
                                  .map((feature: string) => (
                                    <li
                                      key={feature}
                                      className="flex items-center"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                                      {feature}
                                    </li>
                                  ));
                              } catch {
                                return <li>{t("payment.test.featuresError")}</li>;
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
                          {t("payment.test.planLabel")}: {selectedPlan ? selectedPlan.name : t("payment.test.notSelected")}
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
                          {t("payment.test.methodLabel")}:{" "}
                          {paymentMethod === PaymentMethod.CARD
                            ? t("payment.test.methodCardShort")
                            : paymentMethod === PaymentMethod.SBP
                            ? t("payment.test.methodSbpShort")
                            : t("payment.test.methodWalletShort")}
                        </span>
                      </div>
                    </div>
                    {selectedPlan && (
                      <div className="text-green-600 font-medium">
                        {t("payment.test.readyToCreate")}
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
                          {subscription.plan?.name}
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

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
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
