import type { MetadataRoute } from "next";
import { educationGuides } from "@/data/education-guides";
import { lifeGuides } from "@/data/life-guides";
import { SITE_URL } from "@/lib/seo";
import { guideSlug } from "@/lib/guide-slugs";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    ["", "weekly", 1],
    ["/education-guide", "weekly", 0.9],
    ["/life-guide", "weekly", 0.9],
    ["/education/student-slang", "monthly", 0.7],
    ["/education/schedule", "monthly", 0.7],
    ["/buddy", "monthly", 0.7],
    ["/support", "monthly", 0.6],
    ["/privacy-policy", "yearly", 0.3],
    ["/personal-data-consent", "yearly", 0.3],
  ] as const;

  const pages: MetadataRoute.Sitemap = staticPages.map(
    ([path, changeFrequency, priority]) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    }),
  );

  for (const [section, guides] of [
    ["life", lifeGuides],
    ["education", educationGuides],
  ] as const) {
    for (const guide of guides) {
      if (!guide.isPublished) continue;
      pages.push({
        url: `${SITE_URL}/guides/${section}/${guideSlug(guide)}`,
        lastModified: new Date(guide.updatedAt),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return pages;
}
