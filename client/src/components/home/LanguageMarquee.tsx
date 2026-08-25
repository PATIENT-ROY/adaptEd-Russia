"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useAdaptationCta } from "@/hooks/useAdaptationCta";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Language } from "@/types";

type PillTone = "default" | "brand" | "life" | "study";

type Phrase = {
  lang: string;
  text: string;
  href: string;
  tone?: PillTone;
  rtl?: boolean;
  language?: Language;
};

/** Верхний ряд — языки + бренд */
const ROW_PRIMARY: Phrase[] = [
  {
    lang: "RU",
    text: "Учись и живи в России",
    href: "/education-guide",
    language: Language.RU,
  },
  {
    lang: "EN",
    text: "Study & live in Russia",
    href: "/education-guide",
    language: Language.EN,
  },
  { lang: "★", text: "AdaptEd Russia", href: "/", tone: "brand" },
  {
    lang: "FR",
    text: "Étudie et vis en Russie",
    href: "/education-guide",
    language: Language.FR,
  },
  {
    lang: "AR",
    text: "ادرس وعش في روسيا",
    href: "/education-guide",
    language: Language.AR,
    rtl: true,
  },
  {
    lang: "ZH",
    text: "在俄罗斯学习与生活",
    href: "/education-guide",
    language: Language.ZH,
  },
  {
    lang: "RU",
    text: "Гайды без воды",
    href: "/education-guide",
    language: Language.RU,
  },
  {
    lang: "EN",
    text: "From day one in Russia",
    href: "/life-guide#life-guide-arrival",
    language: Language.EN,
  },
];

/** Нижний ряд — темы продукта */
const ROW_TOPICS: Phrase[] = [
  {
    lang: "Быт",
    text: "Миграционный учёт",
    href: `/life-guide?q=${encodeURIComponent("Миграционный учёт")}`,
    tone: "life",
  },
  {
    lang: "Study",
    text: "Сессия без паники",
    href: `/education-guide?q=${encodeURIComponent("сессия")}`,
    tone: "study",
  },
  {
    lang: "Сленг",
    text: "Пара · хвост · стипуха",
    href: "/education/student-slang",
    tone: "study",
  },
  {
    lang: "Docs",
    text: "РВПО · РВП · ВНЖ",
    href: `/life-guide?q=${encodeURIComponent("РВПО")}`,
    tone: "life",
  },
  { lang: "AI", text: "Помощник 24/7", href: "/ai-helper", tone: "brand" },
  {
    lang: "Club",
    text: "Сообщество студентов",
    href: "/community/questions",
    tone: "brand",
  },
  {
    lang: "Life",
    text: "Общежитие и транспорт",
    href: `/life-guide?q=${encodeURIComponent("общежитие")}`,
    tone: "life",
  },
  {
    lang: "FR",
    text: "Premiers pas en Russie",
    href: "/life-guide#life-guide-arrival",
    language: Language.FR,
  },
  {
    lang: "AR",
    text: "دليلك بعد الوصول",
    href: "/life-guide#life-guide-arrival",
    language: Language.AR,
    rtl: true,
  },
  {
    lang: "ZH",
    text: "落地就能用的指南",
    href: "/life-guide#life-guide-arrival",
    language: Language.ZH,
  },
  {
    lang: "EN",
    text: "Insurance · SIM · Bank",
    href: "/life-guide#life-guide-phase-firstWeek",
    language: Language.EN,
  },
  {
    lang: "RU",
    text: "Первые 24 часа",
    href: "/life-guide#life-guide-phase-first24h",
    language: Language.RU,
  },
];

function MarqueePill({
  item,
  duplicate,
}: {
  item: Phrase;
  duplicate: boolean;
}) {
  const { setLanguage } = useLanguage();
  const tone = item.tone ?? "default";

  return (
    <Link
      href={item.href}
      className={`language-marquee__pill language-marquee__pill--${tone}`}
      dir={item.rtl ? "rtl" : "ltr"}
      tabIndex={duplicate ? -1 : undefined}
      aria-hidden={duplicate || undefined}
      onClick={() => {
        if (item.language) setLanguage(item.language);
      }}
    >
      <span className="language-marquee__lang">{item.lang}</span>
      <span className="language-marquee__text">{item.text}</span>
    </Link>
  );
}

function MarqueeTrack({
  phrases,
  reverse = false,
}: {
  phrases: Phrase[];
  reverse?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const items = shouldReduceMotion ? phrases : [...phrases, ...phrases];
  const loopStart = phrases.length;

  return (
    <div
      className={`language-marquee__track ${
        reverse ? "language-marquee__track--reverse" : ""
      }`}
    >
      {items.map((item, index) => (
        <MarqueePill
          key={`${item.lang}-${item.text}-${index}`}
          item={item}
          duplicate={!shouldReduceMotion && index >= loopStart}
        />
      ))}
    </div>
  );
}

export function LanguageMarquee() {
  const { t } = useTranslation();
  const { href: adaptationCtaHref } = useAdaptationCta();
  const primary = ROW_PRIMARY.map((item) =>
    item.lang === "★" ? { ...item, href: adaptationCtaHref } : item,
  );

  return (
    <section
      aria-label={t("home.languageMarquee.aria")}
      className="below-fold my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="language-marquee-host relative mx-auto max-w-7xl overflow-hidden rounded-[28px] sm:rounded-[32px] bg-white/90 px-1 py-6 sm:py-8">
        <p className="sr-only">{t("home.languageMarquee.aria")}</p>

        <div className="language-marquee relative">
          <div className="language-marquee__row">
            <MarqueeTrack phrases={primary} />
          </div>
          <div className="language-marquee__row mt-3">
            <MarqueeTrack phrases={ROW_TOPICS} reverse />
          </div>
        </div>
      </div>
    </section>
  );
}
