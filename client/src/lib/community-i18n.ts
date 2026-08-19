import { Language } from "@/types";

type TFunc = (key: string) => string;

export function getLocaleByLanguage(language?: Language): string {
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

/** Relative time from unix ms / Date using i18n templates. */
export function formatRelativeTime(
  createdAt: number | string | Date,
  t: TFunc,
  language?: Language,
): string {
  const date =
    typeof createdAt === "number"
      ? new Date(createdAt)
      : createdAt instanceof Date
        ? createdAt
        : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("community.time.justNow");
  if (diffMins < 60)
    return t("community.time.minutesAgo").replace("{n}", String(diffMins));
  if (diffHours < 24)
    return t("community.time.hoursAgo").replace("{n}", String(diffHours));
  if (diffDays === 1) return t("community.time.yesterday");
  if (diffDays < 7)
    return t("community.time.daysAgo").replace("{n}", String(diffDays));

  return date.toLocaleDateString(getLocaleByLanguage(language));
}

export function formatAnswersCountLabel(
  count: number,
  t: TFunc,
  language?: Language,
): string {
  const lang = language ?? Language.RU;
  if (lang === Language.RU) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return t("community.questions.answer.one");
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return t("community.questions.answer.few");
    }
    return t("community.questions.answer.many");
  }
  if (lang === Language.FR) {
    return count === 1
      ? t("community.questions.answer.one")
      : t("community.questions.answer.many");
  }
  if (lang === Language.AR || lang === Language.ZH) {
    return t("community.questions.answer.many");
  }
  // EN
  return count === 1
    ? t("community.questions.answer.one")
    : t("community.questions.answer.many");
}
