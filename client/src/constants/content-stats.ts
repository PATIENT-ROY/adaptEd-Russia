import { educationGuides } from "@/data/education-guides";
import { lifeGuides } from "@/data/life-guides";

/** Tool cards open elsewhere (e.g. /student-slang), not in the education articles grid. */
const EDUCATION_TOOL_IDS = new Set(["slang-dictionary"]);

export const EDUCATION_GUIDES_COUNT = educationGuides.filter(
  (guide) => guide.isPublished && !EDUCATION_TOOL_IDS.has(guide.id),
).length;

export const LIFE_GUIDES_COUNT = lifeGuides.filter(
  (guide) => guide.isPublished,
).length;

export const TOTAL_GUIDES_COUNT = EDUCATION_GUIDES_COUNT + LIFE_GUIDES_COUNT;

export const SUPPORTED_LANGUAGES_COUNT = 5;
