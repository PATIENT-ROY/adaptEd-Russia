import { educationGuides } from "@/data/education-guides";
import { lifeGuides } from "@/data/life-guides";
import { guideArticlePath } from "@/lib/guide-routes";
import type { AdminGuideRow, GuideReadCount } from "@/lib/admin-api";
import { Guide, GuideCategory } from "@/types";

function sectionOf(guide: Guide): "education" | "life" {
  return guide.category === GuideCategory.EDUCATION ? "education" : "life";
}

function readKey(guideType: string, guideId: string): string {
  return `${guideType}:${guideId}`;
}

function toAdminRow(guide: Guide, views: number): AdminGuideRow {
  const category = sectionOf(guide);
  return {
    id: guide.id,
    rowKey: readKey(category, guide.id),
    href: guideArticlePath(guide),
    title: guide.title,
    category,
    content: guide.content,
    language: String(guide.language).toLowerCase(),
    tags: guide.tags,
    status: guide.isPublished ? "published" : "draft",
    views,
    createdAt: guide.createdAt,
    updatedAt: guide.updatedAt,
    author: "AdaptEd Russia",
  };
}

const CATALOG: Guide[] = [...lifeGuides, ...educationGuides];

const CATALOG_BY_KEY = new Map(
  CATALOG.map((guide) => [readKey(sectionOf(guide), guide.id), guide]),
);

export function lookupCatalogGuide(
  guideType: string,
  guideId: string,
): Guide | undefined {
  const normalized = guideType === "education" ? "education" : "life";
  return CATALOG_BY_KEY.get(readKey(normalized, guideId));
}

export function mergeAdminGuides(
  reads: GuideReadCount[],
  dbGuides: AdminGuideRow[] = [],
): AdminGuideRow[] {
  const viewsByKey = new Map<string, number>();
  for (const row of reads) {
    const type = row.guideType === "education" ? "education" : "life";
    viewsByKey.set(readKey(type, row.guideId), row.count);
  }

  const fromCatalog = CATALOG.map((guide) => {
    const category = sectionOf(guide);
    return toAdminRow(
      guide,
      viewsByKey.get(readKey(category, guide.id)) ?? 0,
    );
  });

  const seen = new Set(fromCatalog.map((row) => row.rowKey ?? `${row.category}:${row.id}`));
  const extras = dbGuides
    .map((row) => {
      const category =
        row.category.toLowerCase() === "education" ? "education" : "life";
      const rowKey = row.rowKey ?? readKey(category, row.id);
      return {
        ...row,
        category,
        rowKey,
        href: row.href ?? `/guides/${category}/${encodeURIComponent(row.id)}`,
      };
    })
    .filter((row) => {
      if (seen.has(row.rowKey)) return false;
      seen.add(row.rowKey);
      return true;
    });

  return [...fromCatalog, ...extras].sort(
    (a, b) => b.views - a.views || a.title.localeCompare(b.title, "ru"),
  );
}
