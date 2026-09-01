import { Guide, GuideCategory } from "@/types";
import {
  EDUCATION_GUIDE_SLUGS,
  LIFE_GUIDE_SLUGS,
  guideSlug,
} from "@/lib/guide-slugs";

export function guideArticlePath(guide: Guide): string {
  if (
    guide.title.toLowerCase().includes("сленг") ||
    guide.tags.some((tag) => tag.toLowerCase().includes("сленг"))
  ) {
    return "/education/student-slang";
  }

  const section =
    guide.category === GuideCategory.EDUCATION ? "education" : "life";
  return `/guides/${section}/${guideSlug(guide)}`;
}

export function lifeGuidePath(id: string): string {
  return `/guides/life/${LIFE_GUIDE_SLUGS[id] || id}`;
}

export function educationGuidePath(id: string): string {
  return `/guides/education/${EDUCATION_GUIDE_SLUGS[id] || id}`;
}

export function guidePathBySection(
  section: "life" | "education",
  id: string,
): string {
  return section === "education" ? educationGuidePath(id) : lifeGuidePath(id);
}
