import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lifeGuides } from "@/data/life-guides";
import { GuideArticle } from "@/components/seo/guide-article";
import { SITE_URL, guideDescription } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

function findGuide(id: string) {
  return lifeGuides.find((guide) => guide.id === id && guide.isPublished);
}

export function generateStaticParams() {
  return lifeGuides.filter((guide) => guide.isPublished).map((guide) => ({ id: guide.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findGuide(decodeURIComponent((await params).id));
  if (!guide) return {};
  const path = `/guides/life/${encodeURIComponent(guide.id)}`;
  return {
    title: guide.title,
    description: guideDescription(guide),
    keywords: guide.tags,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${path}`,
      title: guide.title,
      description: guideDescription(guide),
      modifiedTime: guide.updatedAt,
    },
  };
}

export default async function LifeGuideArticlePage({ params }: Props) {
  const guide = findGuide(decodeURIComponent((await params).id));
  if (!guide) notFound();
  return <GuideArticle guide={guide} section="life" />;
}
