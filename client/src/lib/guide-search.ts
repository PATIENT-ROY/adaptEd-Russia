import { Guide } from "@/types";

const LIFE_CATEGORY_IDS: Record<string, readonly string[]> = {
  documents: ["2", "3", "migration-card", "7", "rvpo", "rvp", "vnzh"],
  housing: ["1", "6"],
  transport: ["5"],
  health: ["4", "insurance-dms", "medical-checkup", "9", "10", "11", "12", "13", "14"],
  services: [
    "sim-card",
    "8",
    "daily-life",
    "social-adapt",
    "russian-cultural-code",
    "mandatory-expenses",
    "contact-university",
    "russian-holidays",
  ],
};

const EDUCATION_CATEGORY_IDS: Record<string, readonly string[]> = {
  exams: ["0", "1", "5"],
  papers: ["2", "4"],
  documents: ["edu-academic-docs", "6"],
  structure: ["0-main", "3"],
  admission: ["edu-apply-university", "edu-reinstatement"],
  "expulsion-risks": [
    "expulsion-academic",
    "expulsion-attendance",
    "expulsion-migration",
    "expulsion-payment",
    "expulsion-disciplinary",
    "edu-reinstatement",
  ],
};

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
  admission: ["поступление", "приём", "документы"],
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

function expandSearchTokens(query: string): string[] {
  const raw = query.toLowerCase().trim();
  if (!raw) return [];

  const tokens = raw.split(/\s+/).filter((token) => token.length > 1);
  const extra: string[] = [];

  for (const token of tokens) {
    extra.push(...(SEARCH_SYNONYMS[token] ?? []));
  }

  return [...new Set([...tokens, ...extra])];
}

export function guideMatchesQuery(guide: Guide, query: string): boolean {
  const raw = query.toLowerCase().trim();
  if (!raw) return true;

  const userTokens = raw.split(/\s+/).filter((token) => token.length > 1);
  const expanded = expandSearchTokens(raw);
  const titleTags = `${guide.title} ${guide.tags.join(" ")}`.toLowerCase();
  if (expanded.some((token) => titleTags.includes(token))) return true;

  const content = guide.content.toLowerCase();
  return userTokens.some((token) => content.includes(token));
}

export function guideInLifeCategory(guide: Guide, categoryId: string): boolean {
  if (categoryId === "all") return true;
  return LIFE_CATEGORY_IDS[categoryId]?.includes(guide.id) ?? false;
}

export function guideInEducationCategory(guide: Guide, categoryId: string): boolean {
  if (categoryId === "all") return true;
  return EDUCATION_CATEGORY_IDS[categoryId]?.includes(guide.id) ?? false;
}
