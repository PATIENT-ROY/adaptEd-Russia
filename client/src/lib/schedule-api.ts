import { API_BASE_URL } from "@/lib/api";

export type ScheduleSearchType = "group" | "teacher" | "room";
export type ScheduleUniversityId =
  | "spbstu"
  | "mirea"
  | "rudn"
  | "urfu"
  | "ursmu"
  | "knitu"
  | "kfu";

export interface ScheduleUniversity {
  id: ScheduleUniversityId;
  name: string;
  searchTypes: ScheduleSearchType[];
}

export interface ScheduleCity {
  id: string;
  name: string;
  universities: ScheduleUniversity[];
}

export const SCHEDULE_CITIES: ScheduleCity[] = [
  {
    id: "saint-petersburg",
    name: "Санкт-Петербург",
    universities: [
      {
        id: "spbstu",
        name: "СПбПУ Петра Великого",
        searchTypes: ["group", "teacher", "room"],
      },
    ],
  },
  {
    id: "moscow",
    name: "Москва",
    universities: [
      {
        id: "mirea",
        name: "РТУ МИРЭА",
        searchTypes: ["group", "teacher", "room"],
      },
      {
        id: "rudn",
        name: "РУДН имени Патриса Лумумбы",
        searchTypes: ["group"],
      },
    ],
  },
  {
    id: "yekaterinburg",
    name: "Екатеринбург",
    universities: [
      {
        id: "urfu",
        name: "Уральский федеральный университет",
        searchTypes: ["group", "teacher"],
      },
      {
        id: "ursmu",
        name: "Уральский государственный горный университет",
        searchTypes: ["group", "teacher", "room"],
      },
    ],
  },
  {
    id: "kazan",
    name: "Казань",
    universities: [
      {
        id: "knitu",
        name: "КНИТУ",
        searchTypes: ["group"],
      },
      {
        id: "kfu",
        name: "Казанский федеральный университет",
        searchTypes: ["group"],
      },
    ],
  },
];

export interface ScheduleSearchParams {
  university: ScheduleUniversityId;
  dateFrom: string;
  dateTo: string;
  type: ScheduleSearchType;
  value: string;
}

export interface ScheduleItem {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  teachers: string[];
  rooms: string[];
  lessonType: string;
  groups: string[];
}

export interface ScheduleResult {
  university: ScheduleUniversityId;
  universityName: string;
  sourceUrl: string;
  query: {
    type: ScheduleSearchType;
    value: string;
    resolvedValue: string;
  };
  items: ScheduleItem[];
}

interface ScheduleApiResponse {
  success: boolean;
  data?: ScheduleResult | ScheduleItem[] | Partial<ScheduleResult>;
  error?: string;
}

export async function fetchSchedule(
  filters: ScheduleSearchParams,
): Promise<ScheduleResult> {
  const params = new URLSearchParams({
    university: filters.university,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    type: filters.type,
    value: filters.value.trim(),
  });
  const response = await fetch(`${API_BASE_URL}/schedule?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => ({}))) as ScheduleApiResponse;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "SCHEDULE_REQUEST_FAILED");
  }

  return normalizeScheduleResult(payload.data, filters);
}

function normalizeScheduleResult(
  data: ScheduleResult | ScheduleItem[] | Partial<ScheduleResult>,
  filters: ScheduleSearchParams,
): ScheduleResult {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : [];
  const items = rawItems.map(normalizeScheduleItem);

  if (Array.isArray(data)) {
    return {
      university: filters.university,
      universityName: "",
      sourceUrl: "",
      query: {
        type: filters.type,
        value: filters.value.trim(),
        resolvedValue: filters.value.trim(),
      },
      items,
    };
  }

  return {
    university: data.university ?? filters.university,
    universityName: data.universityName ?? "",
    sourceUrl: data.sourceUrl ?? "",
    query: {
      type: data.query?.type ?? filters.type,
      value: data.query?.value ?? filters.value.trim(),
      resolvedValue:
        data.query?.resolvedValue ||
        data.query?.value ||
        filters.value.trim(),
    },
    items,
  };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeScheduleItem(
  item: Partial<ScheduleItem>,
  index: number,
): ScheduleItem {
  return {
    id: item.id || `${item.date || "day"}-${index}`,
    date: item.date || "",
    timeStart: item.timeStart || "",
    timeEnd: item.timeEnd || "",
    subject: item.subject || "",
    teachers: asStringArray(item.teachers),
    rooms: asStringArray(item.rooms),
    lessonType: item.lessonType || "",
    groups: asStringArray(item.groups),
  };
}
