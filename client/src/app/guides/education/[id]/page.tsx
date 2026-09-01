import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { educationGuides } from "@/data/education-guides";
import { GuideArticle } from "@/components/seo/guide-article";
import { SITE_URL, SOCIAL_IMAGE, guideDescription } from "@/lib/seo";
import { findEducationGuideByParam, guideSlug } from "@/lib/guide-slugs";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return educationGuides
    .filter((guide) => guide.isPublished)
    .map((guide) => ({ id: guideSlug(guide) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findEducationGuideByParam((await params).id);
  if (!guide) return {};
  const path = `/guides/education/${guideSlug(guide)}`;
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
  const param = decodeURIComponent((await params).id);
  const guide = findEducationGuideByParam(param);
  if (!guide) notFound();
  const slug = guideSlug(guide);
  if (param !== slug) {
    redirect(`/guides/education/${slug}`);
  }
  return <GuideArticle guide={guide} section="education" />;
}
