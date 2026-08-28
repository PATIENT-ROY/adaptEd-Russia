import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { Guide } from "@/types";
import { StructuredData } from "@/components/seo/structured-data";
import { SITE_URL, guideDescription } from "@/lib/seo";

export function GuideArticle({
  guide,
  section,
}: {
  guide: Guide;
  section: "life" | "education";
}) {
  const catalogUrl = section === "life" ? "/life-guide" : "/education-guide";
  const articleUrl = `${SITE_URL}/guides/${section}/${encodeURIComponent(guide.id)}`;

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <StructuredData data={schema} />
      <StructuredData data={breadcrumbs} />
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10">
        <Link
          href={catalogUrl}
          className="mb-7 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Назад к гайдам
        </Link>

        <header className="mb-8 border-b border-slate-200 pb-7">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600">
            <BookOpen className="h-4 w-4" aria-hidden />
            {section === "life" ? "Жизнь в России" : "Учёба в России"}
          </div>
          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {guideDescription(guide, 240)}
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
    </main>
  );
}
