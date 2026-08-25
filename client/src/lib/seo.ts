import type { Guide } from "@/types";

export const SITE_URL = "https://adaptedrussia.ru";

export function guideDescription(guide: Guide, maxLength = 158): string {
  const text = guide.content
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#*_`|>•▪]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 90 ? lastSpace : undefined).trim()}…`;
}
