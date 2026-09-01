import { educationGuides } from "@/data/education-guides";
import { lifeGuides } from "@/data/life-guides";
import { GuideCategory, type Guide } from "@/types";

/** Old numeric / opaque ids → public slugs. Identity ids are omitted. */
export const LIFE_GUIDE_SLUGS: Record<string, string> = {
  "1": "dorm",
  "2": "inn-snils",
  "3": "lost-passport",
  "4": "call-doctor",
  "5": "transport",
  "7": "migration-registration",
  "8": "bank",
  "14": "medical-tests",
};

export const EDUCATION_GUIDE_SLUGS: Record<string, string> = {
  "0-main": "how-studies-work",
  "0": "exam-vs-credit",
  "1": "session",
  "2": "gost",
  "3": "university-structure",
  "4": "coursework",
  "5": "failed-credit",
  "6": "academic-leave",
};

export function guideSlug(guide: Pick<Guide, "id" | "category">): string {
  const map =
    guide.category === GuideCategory.EDUCATION
      ? EDUCATION_GUIDE_SLUGS
      : LIFE_GUIDE_SLUGS;
  return map[guide.id] || guide.id;
}

export function findLifeGuideByParam(param: string): Guide | undefined {
  const id = decodeURIComponent(param);
  return lifeGuides.find(
    (guide) =>
      guide.isPublished && (guide.id === id || LIFE_GUIDE_SLUGS[guide.id] === id),
  );
}

export function findEducationGuideByParam(param: string): Guide | undefined {
  const id = decodeURIComponent(param);
  return educationGuides.find(
    (guide) =>
      guide.isPublished &&
      (guide.id === id || EDUCATION_GUIDE_SLUGS[guide.id] === id),
  );
}

export function lifeGuideRedirects() {
  return Object.entries(LIFE_GUIDE_SLUGS).map(([from, to]) => ({
    source: `/guides/life/${from}`,
    destination: `/guides/life/${to}`,
    permanent: true as const,
  }));
}

export function educationGuideRedirects() {
  return Object.entries(EDUCATION_GUIDE_SLUGS).map(([from, to]) => ({
    source: `/guides/education/${from}`,
    destination: `/guides/education/${to}`,
    permanent: true as const,
  }));
}
