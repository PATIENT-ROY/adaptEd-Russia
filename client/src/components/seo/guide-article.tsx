"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Language, type Guide } from "@/types";
import { StructuredData } from "@/components/seo/structured-data";
import { SITE_URL, guideDescription } from "@/lib/seo";
import { Layout } from "@/components/layout/layout";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { localizedGuideFields } from "@/data/guide-copy";
import { guideSlug } from "@/lib/guide-slugs";

export function GuideArticle({
  guide,
  section,
}: {
  guide: Guide;
  section: "life" | "education";
}) {
  const { currentLanguage } = useLanguage();
  const [languageReady, setLanguageReady] = useState(false);
  useEffect(() => {
    setLanguageReady(true);
  }, []);
  const displayLanguage = languageReady ? currentLanguage : Language.RU;
  const copy = localizedGuideFields(guide, displayLanguage, section);
  const catalogUrl = section === "life" ? "/life-guide" : "/education-guide";
  const articleUrl = `${SITE_URL}/guides/${section}/${guideSlug(guide)}`;
  const sectionLabel =
    section === "life"
      ? t("lifeGuide.header.title", displayLanguage)
      : t("educationGuide.header.title", displayLanguage);
  const showBodyLanguageNote = displayLanguage !== Language.RU;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guideDescription(guide),
    datePublished: guide.createdAt,
    dateModified: guide.updatedAt,
    inLanguage: "ru-RU",
    mainEntityOfPage: articleUrl,
    image: [`${SITE_URL}/og-image.png`],
    author: { "@type": "Organization", name: "AdaptEd Russia" },
    publisher: {
      "@type": "Organization",
      name: "AdaptEd Russia",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/AdaptEd.png`,
        width: 1024,
        height: 1024,
      },
    },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: section === "life" ? "Гайды по жизни" : "Гайды по учёбе",
        item: `${SITE_URL}${catalogUrl}`,
      },
      { "@type": "ListItem", position: 3, name: guide.title, item: articleUrl },
    ],
  };

  return (
    <Layout>
      <StructuredData data={schema} />
      <StructuredData data={breadcrumbs} />
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10">
        <BackButton
          href={catalogUrl}
          label={t("studentSlang.back", displayLanguage)}
          className="mb-7"
        />

        <header className="mb-8 border-b border-slate-200 pb-7">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600">
            <BookOpen className="h-4 w-4" aria-hidden />
            {sectionLabel}
          </div>
          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {copy.title}
          </h1>
          {copy.excerpt ? (
            <p className="mt-4 text-base leading-7 text-slate-600">
              {copy.excerpt}
            </p>
          ) : null}
          <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {t("guide.article.about", displayLanguage)}{" "}
            <Link
              href="/life-guide#life-guide-arrival"
              className="font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              {t("guide.article.checklist", displayLanguage)}
            </Link>
          </p>
          <p
            className={
              showBodyLanguageNote
                ? "mt-3 text-sm leading-6 text-amber-800"
                : "hidden"
            }
          >
            {t("guide.article.bodyInRussian", displayLanguage)}
          </p>
        </header>

        <div className="prose prose-slate max-w-none break-words prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-table:block prose-table:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2>{children}</h2>,
              h2: ({ children }) => <h3>{children}</h3>,
              h3: ({ children }) => <h4>{children}</h4>,
            }}
          >
            {guide.content}
          </ReactMarkdown>
        </div>
      </article>
    </Layout>
  );
}
