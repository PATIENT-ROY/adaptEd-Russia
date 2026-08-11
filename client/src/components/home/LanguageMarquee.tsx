"use client";

import { useTranslation } from "@/hooks/useTranslation";

type PillTone = "default" | "brand" | "life" | "study";

type Phrase = {
  lang: string;
  text: string;
  tone?: PillTone;
  rtl?: boolean;
};

/** Верхний ряд — языки + бренд */
const ROW_PRIMARY: Phrase[] = [
  { lang: "RU", text: "Учись и живи в России" },
  { lang: "EN", text: "Study & live in Russia" },
  { lang: "★", text: "AdaptEd Russia", tone: "brand" },
  { lang: "FR", text: "Étudie et vis en Russie" },
  { lang: "AR", text: "ادرس وعش في روسيا", rtl: true },
  { lang: "ZH", text: "在俄罗斯学习与生活" },
  { lang: "RU", text: "Гайды без воды" },
  { lang: "EN", text: "From day one in Russia" },
];

/** Нижний ряд — темы продукта */
const ROW_TOPICS: Phrase[] = [
  { lang: "Быт", text: "Миграционный учёт", tone: "life" },
  { lang: "Study", text: "Сессия без паники", tone: "study" },
  { lang: "Docs", text: "РВПО · РВП · ВНЖ", tone: "life" },
  { lang: "AI", text: "Помощник 24/7", tone: "brand" },
  { lang: "Life", text: "Общежитие и транспорт", tone: "life" },
  { lang: "FR", text: "Premiers pas en Russie" },
  { lang: "AR", text: "دليلك بعد الوصول", rtl: true },
  { lang: "ZH", text: "落地就能用的指南" },
  { lang: "EN", text: "Insurance · SIM · Bank" },
  { lang: "RU", text: "Первые 24 часа" },
];

function MarqueeTrack({
  phrases,
  reverse = false,
}: {
  phrases: Phrase[];
  reverse?: boolean;
}) {
  const items = [...phrases, ...phrases];

  return (
    <div
      className={`language-marquee__track ${
        reverse ? "language-marquee__track--reverse" : ""
      }`}
      aria-hidden
    >
      {items.map((item, index) => {
        const tone = item.tone ?? "default";
        return (
          <span
            key={`${item.lang}-${item.text}-${index}`}
            className={`language-marquee__pill language-marquee__pill--${tone}`}
            dir={item.rtl ? "rtl" : "ltr"}
          >
            <span className="language-marquee__lang">{item.lang}</span>
            <span className="language-marquee__text">{item.text}</span>
          </span>
        );
      })}
    </div>
  );
}

export function LanguageMarquee() {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t("home.languageMarquee.aria")}
      className="below-fold my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] sm:rounded-[32px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(59,130,246,0.07),rgba(99,102,241,0.08)_45%,rgba(139,92,246,0.07))] px-1 py-6 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 bottom-0 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl"
        />

        <p className="sr-only">{t("home.languageMarquee.aria")}</p>

        <div className="language-marquee relative">
          <div className="language-marquee__row">
            <MarqueeTrack phrases={ROW_PRIMARY} />
          </div>
          <div className="language-marquee__row mt-3">
            <MarqueeTrack phrases={ROW_TOPICS} reverse />
          </div>
        </div>
      </div>
    </section>
  );
}
