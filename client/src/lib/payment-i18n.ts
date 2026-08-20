import type { SubscriptionPlan } from "@/types";

type TFunc = (key: string) => string;

/** Map known RU feature strings (DB/API) → i18n keys */
const FEATURE_KEYS: Record<string, string> = {
  // Screenshot / shortened variants
  "Все функции Freemium": "payment.plan.feature.allFreemium",
  "Неограниченные уведомления": "payment.plan.feature.unlimitedNotifications",
  "Приоритетный доступ к AI-чату": "payment.plan.feature.priorityAi",
  "Все функции Премиум": "payment.plan.feature.allPremium",
  "Скидка 17% при оплате за год": "payment.plan.feature.yearDiscount",
  "Приоритетная поддержка 24/7": "payment.plan.feature.prioritySupport",

  // Seed / longer variants
  "Бесплатный доступ ко всем базовым гайдам": "payment.plan.feature.freeGuides",
  "2 уведомления-напоминания в месяц": "payment.plan.feature.twoReminders",
  "Базовые шаблоны документов": "payment.plan.feature.basicTemplates",
  "Поддержка по email": "payment.plan.feature.emailSupport",
  "DocScan Light: сканирование до 3 документов в месяц":
    "payment.plan.feature.docscanLightLimit",
  "DocScan Light: только фото → PDF": "payment.plan.feature.docscanLightPhoto",
  "Полный доступ ко всем функциям": "payment.plan.feature.fullAccess",
  "Неограниченные уведомления-напоминания в месяц":
    "payment.plan.feature.unlimitedReminders",
  "Расширенные шаблоны документов": "payment.plan.feature.advancedTemplates",
  "Персональный план адаптации": "payment.plan.feature.personalPlan",
  "Эксклюзивные гайды и материалы": "payment.plan.feature.exclusiveGuides",
  "DocScan Pro: Неограниченное сканирование":
    "payment.plan.feature.docscanProUnlimited",
  "DocScan Pro: OCR из PDF и фото": "payment.plan.feature.docscanProOcr",
  "DocScan Pro: Экспорт в Word, TXT, PDF": "payment.plan.feature.docscanProExport",
  "DocScan Pro: Объединение страниц": "payment.plan.feature.docscanProMerge",
  "DocScan Pro: Облачное хранение": "payment.plan.feature.docscanProCloud",
  "DocScan Pro: Без водяных знаков": "payment.plan.feature.docscanProNoWatermark",
  "Скидка 17% при оплате за 6 месяцев": "payment.plan.feature.sixMonthDiscount",
  "Доступ к закрытым вебинарам": "payment.plan.feature.webinars",
  "Персональный ментор": "payment.plan.feature.mentor",
  "Эксклюзивные мастер-классы": "payment.plan.feature.masterclasses",
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
  if (n.includes("6") || n.includes("шест")) {
    return t("payment.plan.premiumSixMonths");
  }
  return t("payment.plan.premium");
}

export function localizePlanFeature(feature: string, t: TFunc): string {
  const key = FEATURE_KEYS[feature.trim()];
  return key ? t(key) : feature;
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
