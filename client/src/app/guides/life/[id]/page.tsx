import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GuideArticle } from "@/components/seo/guide-article";
import { SITE_URL, SOCIAL_IMAGE, guideDescription } from "@/lib/seo";
import { findLifeGuideByParam, guideSlug } from "@/lib/guide-slugs";
import { lifeGuides } from "@/data/life-guides";

type Props = { params: Promise<{ id: string }> };

// Слаги фиксируются данными репозитория на сборке. Неизвестный параметр не
// рендерится on-demand: этот путь отдавал HTTP 200 с пустым телом.
// Старые числовые id уходят в 308 через redirects в next.config до страницы.
export const dynamicParams = false;

export function generateStaticParams() {
  return lifeGuides
    .filter((guide) => guide.isPublished)
    .map((guide) => ({ id: guideSlug(guide) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findLifeGuideByParam((await params).id);
  if (!guide) notFound();
  const path = `/guides/life/${guideSlug(guide)}`;
  return {
    title: guide.title,
    description: guideDescription(guide),
    keywords: guide.tags,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${path}`,
      title: guide.title,
      description: guideDescription(guide),
      modifiedTime: guide.updatedAt,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guideDescription(guide),
      images: [SOCIAL_IMAGE.url],
    },
  };
}

export default async function LifeGuideArticlePage({ params }: Props) {
  const param = decodeURIComponent((await params).id);
  const guide = findLifeGuideByParam(param);
  if (!guide) notFound();
  const slug = guideSlug(guide);
  if (param !== slug) {
    redirect(`/guides/life/${slug}`);
  }
  return <GuideArticle guide={guide} section="life" />;
}
