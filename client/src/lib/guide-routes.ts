import { Guide, GuideCategory } from "@/types";

export function guideArticlePath(guide: Guide): string {
  if (
    guide.title.toLowerCase().includes("сленг") ||
    guide.tags.some((tag) => tag.toLowerCase().includes("сленг"))
  ) {
    return "/education/student-slang";
  }

  const section =
    guide.category === GuideCategory.EDUCATION ? "education" : "life";
  return `/guides/${section}/${encodeURIComponent(guide.id)}`;
}

export function lifeGuidePath(id: string): string {
  return `/guides/life/${encodeURIComponent(id)}`;
}
