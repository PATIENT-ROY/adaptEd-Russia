import type { SubscriptionPlan } from "@/types";

type TFunc = (key: string) => string;

/** Map known RU feature strings (DB/API) → i18n keys */
const FEATURE_KEYS: Record<string, string> = {
  "Все функции Freemium": "payment.plan.feature.includesFree",
  "Неограниченные уведомления": "payment.plan.feature.unlimitedSends",
  "Приоритетный доступ к AI-чату": "payment.plan.feature.aiDailyPremium",
  "Все функции Премиум": "payment.plan.feature.includesFree",
  "Скидка 17% при оплате за год": "payment.plan.feature.yearDiscount",
  "Приоритетная поддержка 24/7": "payment.plan.feature.formSupport",
  "Бесплатный доступ ко всем базовым гайдам": "payment.plan.feature.freeGuides",
  "2 уведомления-напоминания в месяц": "payment.plan.feature.twoSends",
  "Базовые шаблоны документов": "payment.plan.feature.aiDailyFreemium",
  "Поддержка по email": "payment.plan.feature.formSupport",
  "DocScan Light: сканирование до 3 документов в месяц":
    "payment.plan.feature.docscanBrowser",
  "DocScan Light: только фото → PDF": "payment.plan.feature.docscanBrowser",
  "Полный доступ ко всем функциям": "payment.plan.feature.includesFree",
  "Неограниченные уведомления-напоминания в месяц":
    "payment.plan.feature.unlimitedSends",
  "Расширенные шаблоны документов": "payment.plan.feature.aiDailyPremium",
  "Персональный план адаптации": "payment.plan.feature.includesFree",
  "Эксклюзивные гайды и материалы": "payment.plan.feature.freeGuides",
  "DocScan Pro: Неограниченное сканирование":
    "payment.plan.feature.docscanBrowser",
  "DocScan Pro: OCR из PDF и фото": "payment.plan.feature.docscanBrowser",
  "DocScan Pro: Экспорт в Word, TXT, PDF": "payment.plan.feature.docscanBrowser",
  "DocScan Pro: Объединение страниц": "payment.plan.feature.docscanBrowser",
  "DocScan Pro: Облачное хранение": "payment.plan.feature.docscanBrowser",
  "DocScan Pro: Без водяных знаков": "payment.plan.feature.docscanBrowser",
  "Скидка 17% при оплате за 6 месяцев": "payment.plan.feature.sixMonthDiscount",
  "Доступ к закрытым вебинарам": "payment.plan.feature.includesFree",
  "Персональный ментор": "payment.plan.feature.includesFree",
  "Эксклюзивные мастер-классы": "payment.plan.feature.includesFree",
  "Опубликованные гайды по учёбе и быту": "payment.plan.feature.freeGuides",
  "Сообщество и AdaptEd Buddy": "payment.plan.feature.communityBuddy",
  "DocScan в браузере: OCR фото и PDF, экспорт в TXT":
    "payment.plan.feature.docscanBrowser",
  "Неограниченное создание напоминаний": "payment.plan.feature.unlimitedCreate",
  "2 отправки уведомлений в месяц (email или Telegram)":
    "payment.plan.feature.twoSends",
  "15 сообщений AI в день (чат и генераторы — общая квота)":
    "payment.plan.feature.aiDailyFreemium",
  "Обращения через форму поддержки": "payment.plan.feature.formSupport",
  "Всё из бесплатного тарифа, плюс:": "payment.plan.feature.includesFree",
  "200 сообщений AI в день (чат и генераторы — общая квота)":
    "payment.plan.feature.aiDailyPremium",
  "Неограниченные отправки уведомлений-напоминаний":
    "payment.plan.feature.unlimitedSends",
};

function normalizePlanName(name: string): string {
  return name.trim().toLowerCase().replace(/ё/g, "е");
}

export function localizePlanName(plan: SubscriptionPlan, t: TFunc): string {
  const n = normalizePlanName(plan.name);
  if (plan.price === 0 || n.includes("freemium") || n.includes("бесплат")) {
    return t("payment.plan.freemium");
  }
  if (
    plan.interval === "YEARLY" ||
    n.includes("год") ||
    n.includes("year") ||
    n.includes("annual")
  ) {
    return t("payment.plan.premiumYear");
  }
  if (n.includes("6") || n.includes("шест") || n.includes("six")) {
    return t("payment.plan.premiumSixMonths");
  }
  return t("payment.plan.premium");
}

export function localizePlanFeature(feature: string, t: TFunc): string {
  const key = FEATURE_KEYS[feature.trim()];
  return key ? t(key) : feature;
}

function isFreePlan(plan: SubscriptionPlan): boolean {
  const n = normalizePlanName(plan.name);
  return plan.price === 0 || n.includes("freemium") || n.includes("бесплат");
}

function isYearlyPlan(plan: SubscriptionPlan): boolean {
  const n = normalizePlanName(plan.name);
  return (
    plan.interval === "YEARLY" ||
    n.includes("год") ||
    n.includes("year") ||
    n.includes("annual")
  );
}

function isSixMonthPlan(plan: SubscriptionPlan): boolean {
  const n = normalizePlanName(plan.name);
  return n.includes("6") || n.includes("шест") || n.includes("six");
}

/** Honest feature lists from code, not stale DB JSON. */
export function getCanonicalPlanFeatures(
  plan: SubscriptionPlan,
  t: TFunc,
): string[] {
  if (isFreePlan(plan)) {
    return [
      t("payment.plan.feature.freeGuides"),
      t("payment.plan.feature.communityBuddy"),
      t("payment.plan.feature.docscanBrowser"),
      t("payment.plan.feature.unlimitedCreate"),
      t("payment.plan.feature.twoSends"),
      t("payment.plan.feature.aiDailyFreemium"),
      t("payment.plan.feature.formSupport"),
    ];
  }

  const features = [
    t("payment.plan.feature.includesFree"),
    t("payment.plan.feature.aiDailyPremium"),
    t("payment.plan.feature.unlimitedSends"),
  ];
  if (isYearlyPlan(plan)) {
    features.push(t("payment.plan.feature.yearDiscount"));
  } else if (isSixMonthPlan(plan)) {
    features.push(t("payment.plan.feature.sixMonthDiscount"));
  }
  return features;
}

export function localizePlanFeatures(
  featuresJson: string,
  t: TFunc,
  limit = 3,
): string[] {
  try {
    const features = JSON.parse(featuresJson) as string[];
    return features.slice(0, limit).map((f) => localizePlanFeature(f, t));
  } catch {
    return [];
  }
}

/** Localize payment history description from API (often RU). */
export function localizePaymentDescription(
  description: string | null | undefined,
  t: TFunc,
): string {
  if (!description?.trim()) return t("payment.test.history.generic");
  const d = description.toLowerCase().replace(/ё/g, "е");

  const isMonthly =
    d.includes("месячн") || d.includes("monthly") || d.includes("mois");
  const isYearly =
    d.includes("годов") ||
    d.includes("yearly") ||
    d.includes("annual") ||
    d.includes("annee") ||
    d.includes("année");

  if (d.includes("подписк") || d.includes("subscription") || d.includes("abonnement")) {
    if (isYearly) return t("payment.test.history.premiumYearly");
    if (isMonthly) return t("payment.test.history.premiumMonthly");
    return t("payment.test.history.premium");
  }

  return description;
}
