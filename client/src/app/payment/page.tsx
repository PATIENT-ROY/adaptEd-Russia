"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
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
  ExternalLink,
  Info,
  Crown,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getSubscriptionPlans,
  getPaymentAvailability,
  createPayment,
  getPayment,
  getSubscription,
  getPaymentHistory,
} from "@/lib/api";
import {
  SubscriptionPlan,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
  Payment,
  Subscription,
  PaymentResponse,
  Language,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  localizePlanName,
  localizePaymentDescription,
} from "@/lib/payment-i18n";

type CatalogPlan = {
  id: string;
  nameKey: string;
  periodKey: string;
  months: number;
  popular?: boolean;
  featureKeys: string[];
  extraFeatureKeys: string[];
};

const CATALOG_PLANS: CatalogPlan[] = [
  {
    id: "premium-month",
    nameKey: "payment.plan.premium",
    periodKey: "payment.test.intervalMonthly",
    months: 1,
    featureKeys: [
      "payment.plan.feature.allFreemium",
      "payment.plan.feature.unlimitedNotifications",
      "payment.plan.feature.priorityAi",
      "payment.plan.feature.advancedTemplates",
    ],
    extraFeatureKeys: [
      "payment.plan.feature.personalPlan",
      "payment.plan.feature.exclusiveGuides",
      "payment.plan.feature.docscanProUnlimited",
      "payment.plan.feature.docscanProOcr",
      "payment.plan.feature.prioritySupport",
    ],
  },
  {
    id: "premium-3months",
    nameKey: "payment.plan.premiumThreeMonthsShort",
    periodKey: "payment.plan.intervalThreeMonths",
    months: 3,
    popular: true,
    featureKeys: [
      "payment.plan.feature.allPremium",
      "payment.plan.feature.prioritySupport",
      "payment.plan.feature.personalPlan",
    ],
    extraFeatureKeys: [
      "payment.plan.feature.priorityAi",
      "payment.plan.feature.exclusiveGuides",
      "payment.plan.feature.docscanProUnlimited",
      "payment.plan.feature.docscanProOcr",
      "payment.plan.feature.docscanProExport",
    ],
  },
  {
    id: "premium-year",
    nameKey: "payment.plan.premiumYear",
    periodKey: "payment.test.intervalYearly",
    months: 12,
    featureKeys: [
      "payment.plan.feature.allPremium",
      "payment.plan.feature.prioritySupport",
      "payment.plan.feature.personalPlan",
    ],
    extraFeatureKeys: [
      "payment.plan.feature.priorityAi",
      "payment.plan.feature.webinars",
      "payment.plan.feature.mentor",
      "payment.plan.feature.masterclasses",
      "payment.plan.feature.docscanProUnlimited",
    ],
  },
];

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
    case Language.ES:
      return "es-ES";
    case Language.RU:
    default:
      return "ru-RU";
  }
}

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const locale = getLocaleByLanguage(currentLanguage);
  const [apiPlans, setApiPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("premium-3months");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CARD,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<
    (PaymentResponse & { status?: string }) | Payment | null
  >(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState<
    Record<string, boolean>
  >({});

  const [checkoutAvailable, setCheckoutAvailable] = useState(false);
  const checkoutInFlight = useRef(false);
  const catalogPlans = useMemo(() => {
    const monthlyPrice = apiPlans.find((p) => p.code === 'premium-month')?.price;
    return CATALOG_PLANS.flatMap((template) => {
      const plan = apiPlans.find((p) => p.code === template.id && p.durationMonths === template.months);
      if (!plan) return [];
      const discount = monthlyPrice ? Math.floor((1 - plan.price / (monthlyPrice * plan.durationMonths)) * 100) : 0;
      return [{ ...template, apiPlan: plan, price: plan.price,
        pricePerMonth: Number((plan.price / plan.durationMonths).toFixed(2)),
        discount: discount > 0 ? `${discount}%` : null }];
    });
  }, [apiPlans]);
  const selectedCatalog = catalogPlans.find((p) => p.id === selectedCatalogId) || catalogPlans[0];
  const selectedApiPlan = selectedCatalog?.apiPlan;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [showConfirm, setShowConfirm] = useState(false);
  useBodyScrollLock(showConfirm);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(
    null,
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToastMessage(message);
    setToastType(type);
    const durationMs = type === "success" ? 8000 : 4000;
    setTimeout(() => setToastMessage(null), durationMs);
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
      setIsAuthenticated(!!localStorage.getItem("token"));
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
      const [plansData, subscriptionData, historyData, availability] = await Promise.all([
        getSubscriptionPlans().catch(() => [] as SubscriptionPlan[]),
        getSubscription().catch(() => null as Subscription | null),
        getPaymentHistory().catch(() => [] as Payment[]),
        getPaymentAvailability().catch(() => ({ available: false })),
      ]);
      setApiPlans(plansData.filter((plan) => plan.isActive && plan.price > 0 && plan.currency === "RUB"));
      setCheckoutAvailable(availability.available);
      setSubscription(subscriptionData);
      setPaymentHistory(historyData);
    } catch (error) {
      console.error("Error loading payment page:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const goToCheckoutUrl = (url: string) => {
    window.location.href = url;
  };

  const handleCreatePayment = async () => {
    if (checkoutInFlight.current || isLoadingData || !checkoutAvailable) return;
    if (!selectedApiPlan) {
      showToast(t("payment.checkout.planMissing"), "error");
      return;
    }

    if (!isAuthenticated) {
      requestConfirm(t("payment.test.loginRequired"), () => {
        router.push("/login");
      });
      return;
    }

    checkoutInFlight.current = true;
    setIsLoading(true);
    try {
      const payment = await createPayment({
        planId: selectedApiPlan.id,
        paymentMethod,
      });
      setCurrentPayment(payment);
      if (payment.confirmationUrl) {
        goToCheckoutUrl(payment.confirmationUrl);
        return;
      }
      showToast(t("payment.test.createError"), "error");
    } catch (error) {
      console.error("Error creating payment:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("Authentication required")) {
        requestConfirm(t("payment.test.sessionExpired"), () => {
          router.push("/login");
        });
      } else if (message.includes("PAYMENT_TEST_ONLY")) {
        showToast(t("payment.checkout.testOnly"), "error");
      } else {
        showToast(t("payment.test.createError"), "error");
      }
    } finally {
      checkoutInFlight.current = false;
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
        showToast(t("payment.callback.successMessage"), "success");
      }
    } catch (error) {
      console.error("Error loading payment:", error);
      showToast(t("payment.callback.checkError"), "error");
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
        showToast(t("payment.callback.successMessage"), "success");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      showToast(t("payment.callback.checkError"), "error");
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
      case PaymentStatus.REFUNDED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELED:
      case PaymentStatus.REFUNDED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const payButton = (
    <Button
      onClick={handleCreatePayment}
      disabled={!selectedApiPlan || !checkoutAvailable || isLoadingData || isLoading}
      className="w-full h-12 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
      size="lg"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          {t("payment.test.creating")}
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5 mr-2" />
          {t(checkoutAvailable ? "payment.test.createButton" : "payment.checkout.unavailableButton")} · {selectedCatalog?.price ?? "—"}&nbsp;₽
        </>
      )}
    </Button>
  );

  return (
    <Layout>
      <div className="min-h-[70vh] bg-slate-50 py-6 sm:py-10 rounded-2xl sm:rounded-3xl mx-3 sm:mx-6 lg:mx-8 my-4 sm:my-6 overflow-hidden pb-28 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <BackButton
            label={t("support.back")}
            className="mb-5"
            onClick={() => router.push("/profile")}
          />

          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white mb-4 shadow-md">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {t("payment.checkout.heroTitle")}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
              {t("payment.checkout.heroSubtitle")}
            </p>
          </div>

          {subscription?.status === SubscriptionStatus.ACTIVE && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">
                    {t("payment.test.activeSubscription")}
                  </p>
                  <p className="text-sm text-emerald-800/80">
                    {subscription.plan
                      ? localizePlanName(subscription.plan, t)
                      : t("payment.plan.premium")}
                    {" · "}
                    {t("payment.test.untilLabel")}{" "}
                    {new Date(subscription.endDate).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-emerald-300 bg-white hover:bg-emerald-50"
                onClick={() => router.push("/profile")}
              >
                {t("payment.checkout.goProfile")}
              </Button>
            </div>
          )}

          {isLoadingData ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8">
                {catalogPlans.map((plan) => {
                  const selected = selectedCatalog?.id === plan.id;
                  const expanded = !!featuresExpanded[plan.id];
                  const features = [
                    ...plan.featureKeys,
                    ...(expanded ? plan.extraFeatureKeys : []),
                  ].map((key) => t(key));

                  return (
                    <div
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      onClick={() => setSelectedCatalogId(plan.id)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setSelectedCatalogId(plan.id);
                        }
                      }}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                        selected
                          ? "border-indigo-500 bg-indigo-50/50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 right-4 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
                          {t("payment.checkout.popular")}
                        </span>
                      )}

                      <div className="absolute top-4 right-4">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            selected
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selected && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 pr-8">
                        {t(plan.periodKey)}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900 pr-8">
                        {t(plan.nameKey)}
                      </h3>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        <span className="text-lg text-gray-600">₽</span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {plan.pricePerMonth} ₽ / {t("payment.checkout.monthShort")}
                      </p>

                      {plan.discount && (
                        <p className="mt-1 text-sm font-semibold text-green-600">
                          {t("payment.checkout.discountLabel").replace(
                            "{discount}",
                            plan.discount,
                          )}
                        </p>
                      )}

                      <ul className="mt-6 space-y-3">
                        {features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeaturesExpanded((prev) => ({
                            ...prev,
                            [plan.id]: !prev[plan.id],
                          }));
                        }}
                      >
                        {expanded
                          ? t("home.pricing.hideExtraFeatures")
                          : t("payment.checkout.moreFeatures")}
                      </button>
                    </div>
                  );
                })}
              </div>

              <Card className="border-gray-200 shadow-sm mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {t("payment.test.paymentMethod")}
                  </CardTitle>
                  <CardDescription>
                    {t("payment.checkout.methodHint")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      {
                        method: PaymentMethod.CARD,
                        icon: CreditCard,
                        label: t("payment.test.methodCardShort"),
                      },
                      {
                        method: PaymentMethod.SBP,
                        icon: Smartphone,
                        label: t("payment.test.methodSbpShort"),
                      },
                      {
                        method: PaymentMethod.WALLET,
                        icon: Wallet,
                        label: t("payment.test.methodWalletShort"),
                      },
                    ].map(({ method, icon: Icon, label }) => {
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-2 rounded-xl px-3 py-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            active
                              ? "bg-indigo-50 ring-2 ring-indigo-500 text-indigo-700"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {!checkoutAvailable && (
                <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t("payment.checkout.unavailable")}
                </div>
              )}

              {!isAuthenticated && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("payment.test.authRequired")}</span>
                </div>
              )}

              {!selectedApiPlan && !isLoadingData && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t("payment.checkout.planMissing")}
                </div>
              )}

              <div className="hidden lg:block mb-4">{payButton}</div>

              <p className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 mb-8">
                <Shield className="h-3.5 w-3.5" />
                {t("payment.checkout.secureNote")}
              </p>

              {currentPayment && (
                <Card className="mb-6 border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {t("payment.test.currentPayment")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {t("payment.test.statusLabel")}
                      </span>
                      <Badge
                        className={getStatusColor(
                          getPaymentStatus(currentPayment) || "",
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {getStatusIcon(
                            getPaymentStatus(currentPayment) || "",
                          )}
                          {t(`payment.callback.status${getPaymentStatus(currentPayment) === PaymentStatus.SUCCEEDED ? "Succeeded" : getPaymentStatus(currentPayment) === PaymentStatus.CANCELED ? "Canceled" : getPaymentStatus(currentPayment) === PaymentStatus.FAILED ? "Failed" : getPaymentStatus(currentPayment) === PaymentStatus.REFUNDED ? "Refunded" : "Pending"}`)}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {t("payment.test.amountLabel")}
                      </span>
                      <span className="font-semibold">
                        {getPaymentAmount(currentPayment)} ₽
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {getConfirmationUrl(currentPayment) &&
                        getPaymentStatus(currentPayment) !==
                          PaymentStatus.SUCCEEDED && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              goToCheckoutUrl(
                                getConfirmationUrl(currentPayment)!,
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t("payment.test.goToPay")}
                          </Button>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleCheckPayment}
                      >
                        {t("payment.test.checkStatus")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentHistory.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50"
                    onClick={() => setShowHistory((v) => !v)}
                  >
                    <span className="font-semibold text-gray-900">
                      {t("payment.test.paymentHistory")}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({paymentHistory.length})
                      </span>
                    </span>
                    {showHistory ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {showHistory && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
                      {paymentHistory.slice(0, 8).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-start gap-3 rounded-xl bg-gray-50 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                              {localizePaymentDescription(
                                payment.description,
                                t,
                                payment.amount,
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(payment.createdAt).toLocaleDateString(
                                locale,
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold whitespace-nowrap">
                              {payment.amount}&nbsp;₽
                            </span>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusIcon(payment.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span className="truncate font-medium text-gray-900">
              {selectedCatalog ? t(selectedCatalog.nameKey) : t("payment.checkout.heroTitle")}
            </span>
            <span className="font-semibold text-gray-900">
              {selectedCatalog?.price ?? "—"}&nbsp;₽
            </span>
          </div>
          {payButton}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed right-4 left-4 sm:left-auto sm:right-6 top-20 z-[110] animate-in fade-in slide-in-from-top-4">
          <div
            className={`rounded-xl px-5 py-3 shadow-lg text-white text-sm font-medium ${
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

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-slate-800 mb-6">{confirmMessage}</p>
            <div className="flex justify-end gap-3">
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

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="min-h-[50vh] flex items-center justify-center">
            <h1 className="sr-only">Тарифы AdaptEd Russia</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        </Layout>
      }
    >
      <PaymentCheckoutContent />
    </Suspense>
  );
}
