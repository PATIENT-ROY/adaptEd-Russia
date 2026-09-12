import type { Guide } from "@/types";
import { guideInLifeCategory } from "./guide-search";

/** Only the arrival checklist skips a category when there is no choice to make. */
export function arrivalStepGuide(
  step: { guideId?: string; categoryId?: string },
  guides: readonly Guide[],
): Guide | undefined {
  if (step.guideId) return guides.find(guide => guide.isPublished && guide.id === step.guideId);
  if (!step.categoryId) return undefined;
  const candidates = guides.filter(guide => guide.isPublished && guideInLifeCategory(guide, step.categoryId!));
  return candidates.length === 1 ? candidates[0] : undefined;
}
