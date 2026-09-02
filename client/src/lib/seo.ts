import type { Metadata } from "next";
import { getGuideCopy } from "@/data/guide-copy";
import { GuideCategory, Language, type Guide } from "@/types";

export const SITE_URL = "https://adaptedrussia.ru";

export function guideDescription(guide: Guide, maxLength = 158): string {
  const section =
    guide.category === GuideCategory.EDUCATION ? "education" : "life";
  const excerpt = getGuideCopy(section, guide.id, Language.RU)?.excerpt;
  const text = (excerpt || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 90 ? lastSpace : undefined).trim()}…`;
}


export const SOCIAL_IMAGE = {
  url: "/og-image-v2.jpg",
  secureUrl: "https://adaptedrussia.ru/og-image-v2.jpg",
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "AdaptEd Russia — помощь иностранным студентам в России",
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  if (noIndex) {
    return {
      title,
      description,
      alternates: { canonical: path },
      robots: { index: false, follow: false },
    };
  }

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "AdaptEd Russia",
      locale: "ru_RU",
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
    robots: { index: true, follow: true },
  };
}
