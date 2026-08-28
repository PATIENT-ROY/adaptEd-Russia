import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { educationGuides } from "@/data/education-guides";
import { GuideArticle } from "@/components/seo/guide-article";
import { SITE_URL, SOCIAL_IMAGE, guideDescription } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

function findGuide(id: string) {
  return educationGuides.find((guide) => guide.id === id && guide.isPublished);
}

export function generateStaticParams() {
  return educationGuides.filter((guide) => guide.isPublished).map((guide) => ({ id: guide.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findGuide(decodeURIComponent((await params).id));
  if (!guide) return {};
  const path = `/guides/education/${encodeURIComponent(guide.id)}`;
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

export default async function EducationGuideArticlePage({ params }: Props) {
  const guide = findGuide(decodeURIComponent((await params).id));
  if (!guide) notFound();
  return <GuideArticle guide={guide} section="education" />;
}
