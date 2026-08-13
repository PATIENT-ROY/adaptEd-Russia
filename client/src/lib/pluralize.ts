import { Language } from "@/types";

/** Russian (and similar Slavic) plural categories. */
export type PluralCategory = "one" | "few" | "many";

export function getPluralCategory(count: number, language: Language): PluralCategory {
  const n = Math.abs(count);

  if (language === Language.RU) {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 14) return "many";
    if (mod10 === 1) return "one";
    if (mod10 >= 2 && mod10 <= 4) return "few";
    return "many";
  }

  // EN / FR / AR / ZH: simple singular vs plural
  return n === 1 ? "one" : "many";
}

/**
 * Builds "{count} гайд/гайда/гайдов" (or locale equivalent) from translation keys:
 *   `${baseKey}.one` | `.few` | `.many`
 * Fallback: `.many` → `.one`
 */
export function formatCountedLabel(
  count: number,
  language: Language,
  t: (key: string) => string,
  baseKey: string,
): string {
  const category = getPluralCategory(count, language);
  const unit =
    t(`${baseKey}.${category}`) ||
    t(`${baseKey}.many`) ||
    t(`${baseKey}.one`) ||
    "";
  return `${count} ${unit}`.trim();
}
