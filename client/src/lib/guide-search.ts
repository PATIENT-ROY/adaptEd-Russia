import { Guide } from "@/types";

const SEARCH_SYNONYMS: Record<string, string[]> = {
  dorm: ["общежитие", "общага", "dormitory"],
  dormitory: ["общежитие"],
  housing: ["общежитие", "аренда", "квартира", "жильё"],
  rent: ["аренда", "квартира"],
  rental: ["аренда", "квартира"],
  insurance: ["страховка", "дмс", "омс", "полис"],
  sim: ["sim", "связь", "телефон"],
  bank: ["банк", "карта", "счёт"],
  banking: ["банк"],
  metro: ["метро", "транспорт"],
  transport: ["транспорт", "метро", "автобус"],
  doctor: ["врач", "медицина", "поликлиника"],
  medical: ["медицина", "врач", "страховка", "медосмотр"],
  health: ["здоровье", "медицина", "врач"],
  visa: ["виза", "миграция"],
  migration: ["миграция", "учёт", "регистрация"],
  passport: ["паспорт"],
  inn: ["инн"],
  snils: ["снилс"],
  exam: ["экзамен", "сессия", "зачёт"],
  exams: ["экзамены", "сессия"],
  session: ["сессия", "экзамены"],
  coursework: ["курсовая"],
  gost: ["гост"],
  slang: ["сленг"],
  expulsion: ["отчисление", "восстановление"],
  reinstatement: ["восстановление", "отчисление"],
  admission: ["поступление", "приём", "документы", "подфак"],
  preparatory: ["подготовительный", "подфак"],
  "подфак": ["подготовительный"],
  "подготовительный": ["подфак"],
  "восстановление": ["отчисление", "поступление"],
  "поступление": ["приём", "документы", "квота"],
  "приём": ["поступление", "документы"],
  attendance: ["пропуски", "посещаемость"],
  scholarship: ["стипендия"],
  schedule: ["расписание"],
  holiday: ["праздник", "выходной", "каникулы"],
  holidays: ["праздники", "выходные"],
  "праздник": ["выходной", "каникулы", "holiday"],
  "праздники": ["выходные", "каникулы"],
  "выходной": ["праздник"],
  culture: ["культура", "этикет", "нормы"],
  cultural: ["культура", "этикет"],
  etiquette: ["этикет", "культура"],
  "культура": ["этикет", "нормы", "адаптация"],
  "этикет": ["культура", "нормы"],
  "культурный": ["культура", "этикет"],
  logement: ["общежитие", "аренда", "квартира"],
  assurance: ["страховка", "дмс", "омс"],
  banque: ["банк"],
  transports: ["транспорт", "метро"],
  examen: ["экзамен", "сессия"],
  "宿舍": ["общежитие"],
  "保险": ["страховка", "дмс"],
  "银行": ["банк"],
  "交通": ["транспорт"],
  "考试": ["экзамен", "сессия"],
  "签证": ["виза", "миграция"],
};

// Normalize both indexed fields and queries, including synonym keys/values.
export function normalizeGuideSearch(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

const synonyms = Object.fromEntries(Object.entries(SEARCH_SYNONYMS).map(
  ([key, values]) => [normalizeGuideSearch(key), values.map(normalizeGuideSearch)],
));

const WHOLE_WORD_TERMS = new Set(["гост", "инн", "снилс", "дмс", "омс", "рвп", "рвпо", "внж", "sim"]);

function matchesToken(text: string, token: string): boolean {
  // Abbreviations must be whole words; longer terms retain prefix matching.
  return text.split(" ").some(word => word === token || (token.length >= 3 && !WHOLE_WORD_TERMS.has(token) && word.startsWith(token)));
}

/** Lower scores are better. Every query term must match, even across fields. */
export function guideSearchRank(guide: Guide, query: string): number | null {
  const normalized = normalizeGuideSearch(query);
  if (!normalized) return 0;
  const title = normalizeGuideSearch(guide.title);
  const tags = normalizeGuideSearch(guide.tags.join(" "));
  // URLs are references rather than article text.
  const content = normalizeGuideSearch(guide.content.replace(/https?:\/\/\S+/g, " "));
  const groups = normalized.split(" ").map(token => [token, ...(synonyms[token] ?? [])]);
  const inField = (field: string, group: string[]) => group.some(token => matchesToken(field, token));
  if (!groups.every(group => [title, tags, content].some(field => inField(field, group)))) return null;
  if (title === normalized) return 0;
  if (groups.every(group => inField(title, group))) return 1;
  if (groups.every(group => inField(title, group) || inField(tags, group))) return 2;
  return 3;
}

export function guideMatchesQuery(guide: Guide, query: string): boolean {
  return guideSearchRank(guide, query) !== null;
}

export function searchGuides(guides: Guide[], query: string): Guide[] {
  return guides.filter(guide => guide.isPublished)
    .map(guide => ({ guide, rank: guideSearchRank(guide, query) }))
    .filter((item): item is { guide: Guide; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank).map(item => item.guide);
}

export function guideInLifeCategory(guide: Guide, categoryId: string): boolean {
  return categoryId === "all" || (guide.filterCategories?.some(id => id === categoryId) ?? false);
}

export const guideInEducationCategory = guideInLifeCategory;
