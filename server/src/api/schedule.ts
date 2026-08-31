import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const SPBSTU_API_BASE = (
  process.env.SPBSTU_SCHEDULE_API_URL ||
  'https://ruz.spbstu.ru/api/v1/ruz'
).replace(/\/$/, '');
const UPSTREAM_TIMEOUT_MS = 12_000;
const ROOM_DIRECTORY_TTL_MS = 60 * 60 * 1000;

type SearchType = 'group' | 'teacher' | 'room';
type UniversityId =
  | 'spbstu'
  | 'mirea'
  | 'rudn'
  | 'urfu'
  | 'ursmu'
  | 'knitu'
  | 'kfu';

interface ScheduleItem {
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

interface ScheduleResult {
  university: UniversityId;
  universityName: string;
  sourceUrl: string;
  query: {
    type: SearchType;
    value: string;
    resolvedValue: string;
  };
  items: ScheduleItem[];
}

interface SpbstuGroup {
  id: number;
  name: string;
}

interface SpbstuTeacher {
  id: number;
  full_name: string;
}

interface SpbstuBuilding {
  id: number;
  name: string;
  abbr?: string;
}

interface SpbstuRoom {
  id: number;
  name: string;
}

interface RoomTarget extends SpbstuRoom {
  building: SpbstuBuilding;
}

interface SpbstuLesson {
  time_start?: string;
  time_end?: string;
  subject?: string;
  subject_short?: string;
  typeObj?: { name?: string; abbr?: string };
  teachers?: Array<{ full_name?: string }>;
  auditories?: Array<{
    name?: string;
    building?: { name?: string; abbr?: string };
  }>;
  groups?: Array<{ name?: string }>;
}

interface SpbstuDay {
  date?: string;
  lessons?: SpbstuLesson[];
}

interface SpbstuScheduleResponse {
  error?: boolean;
  text?: string;
  days?: SpbstuDay[];
}

interface ScheduleTarget {
  id: number;
  label: string;
  schedulePath: (date: string) => string;
}

class ScheduleError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ScheduleError';
  }
}

const getScheduleSchema = z
  .object({
    university: z
      .enum(['spbstu', 'mirea', 'rudn', 'urfu', 'ursmu', 'knitu', 'kfu'])
      .default('spbstu'),
    dateFrom: z.string().date(),
    dateTo: z.string().date(),
    type: z.enum(['group', 'teacher', 'room']),
    value: z.string().trim().min(2).max(120),
  })
  .superRefine((value, ctx) => {
    const from = new Date(`${value.dateFrom}T00:00:00Z`);
    const to = new Date(`${value.dateTo}T00:00:00Z`);
    const rangeDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);

    if (rangeDays < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTo'],
        message: 'Конечная дата должна быть не раньше начальной',
      });
    }

    if (rangeDays > 42) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTo'],
        message: 'За один запрос можно получить не более 6 недель',
      });
    }
  });

let roomDirectoryCache:
  | { expiresAt: number; rooms: RoomTarget[] }
  | undefined;

async function spbstuRequest<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${SPBSTU_API_BASE}/${path.replace(/^\//, '')}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ScheduleError(
        `Сервис расписания СПбПУ вернул HTTP ${response.status}`,
        502,
        'SPBSTU_UPSTREAM_ERROR',
      );
    }

    const data = (await response.json()) as T & { error?: boolean; text?: string };
    if (data?.error) {
      throw new ScheduleError(
        data.text || 'Сервис расписания СПбПУ вернул ошибку',
        502,
        'SPBSTU_UPSTREAM_ERROR',
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ScheduleError) throw error;

    const reason = error instanceof Error ? error.message : String(error);
    console.error('SPbPU schedule request failed:', reason);
    throw new ScheduleError(
      'Сервис расписания СПбПУ временно недоступен',
      502,
      'SPBSTU_UNAVAILABLE',
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSearchValue(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ').trim();
}

function bestMatch<T>(items: T[], query: string, getLabel: (item: T) => string): T | undefined {
  const normalizedQuery = normalizeSearchValue(query);
  return (
    items.find((item) => normalizeSearchValue(getLabel(item)) === normalizedQuery) ||
    items.find((item) => normalizeSearchValue(getLabel(item)).startsWith(normalizedQuery)) ||
    items[0]
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

async function getRoomDirectory(): Promise<RoomTarget[]> {
  if (roomDirectoryCache && roomDirectoryCache.expiresAt > Date.now()) {
    return roomDirectoryCache.rooms;
  }

  const { buildings } = await spbstuRequest<{ buildings: SpbstuBuilding[] }>('buildings');
  const roomLists = await mapWithConcurrency(buildings || [], 6, async (building) => {
    try {
      const { rooms } = await spbstuRequest<{ rooms: SpbstuRoom[] }>(
        `buildings/${building.id}/rooms`,
      );
      return (rooms || []).map((room) => ({ ...room, building }));
    } catch (error) {
      console.warn(`SPbPU rooms unavailable for building ${building.id}:`, error);
      return [];
    }
  });

  const rooms = roomLists.flat();
  if (rooms.length === 0) {
    throw new ScheduleError(
      'Список аудиторий СПбПУ временно недоступен',
      502,
      'SPBSTU_UNAVAILABLE',
    );
  }
  roomDirectoryCache = {
    rooms,
    expiresAt: Date.now() + ROOM_DIRECTORY_TTL_MS,
  };
  return rooms;
}

async function resolveTargets(type: SearchType, value: string): Promise<ScheduleTarget[]> {
  if (type === 'group') {
    const { groups } = await spbstuRequest<{ groups: SpbstuGroup[] | null }>(
      `search/groups?q=${encodeURIComponent(value)}`,
    );
    const group = bestMatch(groups || [], value, (item) => item.name);
    if (!group) {
      throw new ScheduleError('Группа СПбПУ не найдена', 404, 'SCHEDULE_TARGET_NOT_FOUND');
    }
    return [
      {
        id: group.id,
        label: group.name,
        schedulePath: (date) => `scheduler/${group.id}?date=${date}`,
      },
    ];
  }

  if (type === 'teacher') {
    const { teachers } = await spbstuRequest<{ teachers: SpbstuTeacher[] | null }>(
      `search/teachers?q=${encodeURIComponent(value)}`,
    );
    const teacher = bestMatch(teachers || [], value, (item) => item.full_name);
    if (!teacher) {
      throw new ScheduleError(
        'Преподаватель СПбПУ не найден',
        404,
        'SCHEDULE_TARGET_NOT_FOUND',
      );
    }
    return [
      {
        id: teacher.id,
        label: teacher.full_name,
        schedulePath: (date) => `teachers/${teacher.id}/scheduler?date=${date}`,
      },
    ];
  }

  const rooms = await getRoomDirectory();
  const normalizedQuery = normalizeSearchValue(value);
  const exactMatches = rooms.filter(
    (room) => normalizeSearchValue(room.name) === normalizedQuery,
  );
  const partialMatches = rooms.filter((room) => {
    const fullName = `${room.building.name} ${room.building.abbr || ''} ${room.name}`;
    return normalizeSearchValue(fullName).includes(normalizedQuery);
  });
  const matches = (exactMatches.length ? exactMatches : partialMatches).slice(0, 8);

  if (!matches.length) {
    throw new ScheduleError('Аудитория СПбПУ не найдена', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  }

  return matches.map((room) => ({
    id: room.id,
    label: `${room.building.name}, ауд. ${room.name}`,
    schedulePath: (date) =>
      `buildings/${room.building.id}/rooms/${room.id}/scheduler?date=${date}`,
  }));
}

function dateAnchors(dateFrom: string, dateTo: string): string[] {
  const cursor = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  const anchors: string[] = [];
  const weekday = cursor.getUTCDay();
  cursor.setUTCDate(cursor.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));

  while (cursor <= end) {
    anchors.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return anchors;
}

function normalizeDate(value?: string): string {
  return value ? value.replace(/[./]/g, '-') : '';
}

function mapScheduleResponse(
  response: SpbstuScheduleResponse,
  target: ScheduleTarget,
  dateFrom: string,
  dateTo: string,
): ScheduleItem[] {
  const items: ScheduleItem[] = [];

  for (const day of response.days || []) {
    const date = normalizeDate(day.date);
    if (!date || date < dateFrom || date > dateTo) continue;

    for (const [index, lesson] of (day.lessons || []).entries()) {
      const teachers = (lesson.teachers || [])
        .map((teacher) => teacher.full_name?.trim())
        .filter((name): name is string => Boolean(name));
      const rooms = (lesson.auditories || [])
        .map((auditory) => {
          const building = auditory.building?.abbr || auditory.building?.name;
          return [building, auditory.name].filter(Boolean).join(', ');
        })
        .filter(Boolean);
      const groups = (lesson.groups || [])
        .map((group) => group.name?.trim())
        .filter((name): name is string => Boolean(name));

      items.push({
        id: `${target.id}-${date}-${lesson.time_start || index}-${index}`,
        date,
        timeStart: lesson.time_start || '',
        timeEnd: lesson.time_end || '',
        subject: lesson.subject || lesson.subject_short || 'Занятие',
        teachers,
        rooms,
        lessonType: lesson.typeObj?.name || lesson.typeObj?.abbr || '',
        groups,
      });
    }
  }

  return items;
}

async function fetchSpbstuSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  const targets = await resolveTargets(filters.type, filters.value);
  const anchors = dateAnchors(filters.dateFrom, filters.dateTo);
  const jobs = targets.flatMap((target) =>
    anchors.map((date) => ({ target, date })),
  );
  const items = (
    await mapWithConcurrency(jobs, 6, async ({ target, date }) => {
      const response = await spbstuRequest<SpbstuScheduleResponse>(target.schedulePath(date));
      return mapScheduleResponse(response, target, filters.dateFrom, filters.dateTo);
    })
  )
    .flat()
    .filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.date === item.date &&
            candidate.timeStart === item.timeStart &&
            candidate.subject === item.subject &&
            candidate.rooms.join('|') === item.rooms.join('|'),
        ) === index,
    )
    .sort((a, b) =>
      `${a.date}T${a.timeStart}`.localeCompare(`${b.date}T${b.timeStart}`),
    );

  return {
    university: 'spbstu',
    universityName: 'Санкт-Петербургский политехнический университет Петра Великого',
    sourceUrl: 'https://ruz.spbstu.ru/',
    query: {
      type: filters.type,
      value: filters.value,
      resolvedValue: targets.map((target) => target.label).join('; '),
    },
    items,
  };
}

interface ProviderDefinition {
  id: UniversityId;
  cityId: 'saint-petersburg' | 'moscow' | 'yekaterinburg' | 'kazan';
  cityName: string;
  name: string;
  sourceUrl: string;
  searchTypes: SearchType[];
}

const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'spbstu',
    cityId: 'saint-petersburg',
    cityName: 'Санкт-Петербург',
    name: 'Санкт-Петербургский политехнический университет Петра Великого',
    sourceUrl: 'https://ruz.spbstu.ru/',
    searchTypes: ['group', 'teacher', 'room'],
  },
  {
    id: 'mirea',
    cityId: 'moscow',
    cityName: 'Москва',
    name: 'РТУ МИРЭА',
    sourceUrl: 'https://schedule-of.mirea.ru/',
    searchTypes: ['group', 'teacher', 'room'],
  },
  {
    id: 'rudn',
    cityId: 'moscow',
    cityName: 'Москва',
    name: 'Российский университет дружбы народов имени Патриса Лумумбы',
    sourceUrl: 'https://www.rudn.ru/education/schedule',
    searchTypes: ['group'],
  },
  {
    id: 'urfu',
    cityId: 'yekaterinburg',
    cityName: 'Екатеринбург',
    name: 'Уральский федеральный университет',
    sourceUrl: 'https://urfu.ru/ru/students/study/schedule/',
    searchTypes: ['group', 'teacher'],
  },
  {
    id: 'ursmu',
    cityId: 'yekaterinburg',
    cityName: 'Екатеринбург',
    name: 'Уральский государственный горный университет',
    sourceUrl: 'https://www.ursmu.ru/raspisanie-zanyatii',
    searchTypes: ['group', 'teacher', 'room'],
  },
  {
    id: 'knitu',
    cityId: 'kazan',
    cityName: 'Казань',
    name: 'Казанский национальный исследовательский технологический университет',
    sourceUrl: 'https://www.kstu.ru/www_GFgrid.jsp',
    searchTypes: ['group'],
  },
  {
    id: 'kfu',
    cityId: 'kazan',
    cityName: 'Казань',
    name: 'Казанский федеральный университет',
    sourceUrl: 'https://kpfu.ru/subject_schedule_web.schedule_type_study',
    searchTypes: ['group'],
  },
];

function provider(id: UniversityId): ProviderDefinition {
  return PROVIDERS.find((item) => item.id === id)!;
}

function htmlText(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function upstreamFetch(
  url: string,
  init: RequestInit = {},
  label = 'расписания',
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/html, text/calendar;q=0.9, */*;q=0.8',
        'User-Agent': 'AdaptEd-Russia-Schedule/1.0',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new ScheduleError(
        `Официальный сервис ${label} вернул HTTP ${response.status}`,
        502,
        'SCHEDULE_UPSTREAM_ERROR',
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ScheduleError) throw error;
    console.error(`${label} request failed:`, error);
    throw new ScheduleError(
      `Официальный сервис ${label} временно недоступен`,
      502,
      'SCHEDULE_UNAVAILABLE',
    );
  } finally {
    clearTimeout(timeout);
  }
}

function resultFor(
  definition: ProviderDefinition,
  filters: z.infer<typeof getScheduleSchema>,
  resolvedValue: string,
  items: ScheduleItem[],
): ScheduleResult {
  return {
    university: definition.id,
    universityName: definition.name,
    sourceUrl: definition.sourceUrl,
    query: {
      type: filters.type,
      value: filters.value,
      resolvedValue,
    },
    items: items
      .filter((item) => item.date >= filters.dateFrom && item.date <= filters.dateTo)
      .sort((a, b) => `${a.date}T${a.timeStart}`.localeCompare(`${b.date}T${b.timeStart}`)),
  };
}

function parseCompactDate(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return '';
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function unescapeCalendar(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function calendarProperty(block: string, name: string): string {
  const line = block
    .split(/\r?\n/)
    .find((candidate) => candidate === name || candidate.startsWith(`${name}:`) || candidate.startsWith(`${name};`));
  return line?.slice(line.indexOf(':') + 1) || '';
}

async function fetchMireaSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  const definition = provider('mirea');
  const targetType = { group: 1, teacher: 2, room: 3 }[filters.type];
  const searchResponse = await upstreamFetch(
    `https://schedule-of.mirea.ru/schedule/api/search?match=${encodeURIComponent(filters.value)}&limit=30`,
    {},
    'расписания РТУ МИРЭА',
  );
  const search = (await searchResponse.json()) as {
    data?: Array<{ id: number; targetTitle?: string; fullTitle?: string; scheduleTarget?: number }>;
  };
  const matches = (search.data || []).filter((item) => item.scheduleTarget === targetType);
  const target = bestMatch(matches, filters.value, (item) => item.fullTitle || item.targetTitle || '');
  if (!target) {
    throw new ScheduleError('Объект расписания РТУ МИРЭА не найден', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  }

  const icalResponse = await upstreamFetch(
    `https://schedule-of.mirea.ru/schedule/api/ical/${targetType}/${target.id}`,
    {},
    'расписания РТУ МИРЭА',
  );
  const calendar = (await icalResponse.text()).replace(/\r?\n[ \t]/g, '');
  const blocks = calendar.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  const items = blocks.flatMap((block, index): ScheduleItem[] => {
    const start = calendarProperty(block, 'DTSTART');
    if (!start.includes('T')) return [];
    const end = calendarProperty(block, 'DTEND');
    const description = unescapeCalendar(calendarProperty(block, 'DESCRIPTION'));
    const teacherMatch = description.match(/Преподаватель:\s*(.+?)(?:\s{2,}|$)/i);
    const date = parseCompactDate(start);
    return [{
      id: `mirea-${target.id}-${start}-${index}`,
      date,
      timeStart: `${start.slice(9, 11)}:${start.slice(11, 13)}`,
      timeEnd: end.includes('T') ? `${end.slice(9, 11)}:${end.slice(11, 13)}` : '',
      subject: unescapeCalendar(calendarProperty(block, 'SUMMARY')) || 'Занятие',
      teachers: teacherMatch ? [teacherMatch[1].trim()] : [],
      rooms: [unescapeCalendar(calendarProperty(block, 'LOCATION'))].filter(Boolean),
      lessonType: unescapeCalendar(calendarProperty(block, 'CATEGORIES')),
      groups: filters.type === 'group' ? [target.fullTitle || target.targetTitle || filters.value] : [],
    }];
  });

  return resultFor(
    definition,
    filters,
    target.fullTitle || target.targetTitle || filters.value,
    items,
  );
}

const RUDN_FACULTIES = [
  '9da80918-b523-11e8-82c5-d85de2dacc30',
  'a4c01c99-bea4-11ee-81db-00155d320e03',
  'abdcf679-b523-11e8-82c5-d85de2dacc30',
  'd4e0f16b-b820-11ed-818d-00155d320d03',
  'abdcf5e4-b523-11e8-82c5-d85de2dacc30',
  'abdcf62d-b523-11e8-82c5-d85de2dacc30',
  'ce245cf3-ab74-11e4-80e2-005056837a1d',
  '29dd5a94-dfed-11ef-821f-00155d320f02',
  '69ee29c7-e9b5-11e3-82f8-7427eada72de',
  'abdcf883-b523-11e8-82c5-d85de2dacc30',
  'abdcf6ff-b523-11e8-82c5-d85de2dacc30',
  '83729e33-c055-11ee-81cf-00155d320f02',
  'abdcf766-b523-11e8-82c5-d85de2dacc30',
  'abdcf736-b523-11e8-82c5-d85de2dacc30',
  'abdcf632-b523-11e8-82c5-d85de2dacc30',
  'abdcf837-b523-11e8-82c5-d85de2dacc30',
];

let rudnGroupsCache:
  | { expiresAt: number; groups: Array<{ label: string; value: string }> }
  | undefined;

async function rudnGroups(): Promise<Array<{ label: string; value: string }>> {
  if (rudnGroupsCache && rudnGroupsCache.expiresAt > Date.now()) return rudnGroupsCache.groups;
  const lists = await mapWithConcurrency(RUDN_FACULTIES, 4, async (faculty) => {
    try {
      const body = new URLSearchParams({ facultet: faculty, level: '', kurs: '', form: '', group: '', action: 'filterData' });
      const response = await upstreamFetch(
        'https://www.rudn.ru/api/v1/education/schedule',
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body },
        'расписания РУДН',
      );
      const payload = (await response.json()) as {
        data?: { elements?: { group?: { list?: Array<{ label: string; value: string }> } } };
      };
      return payload.data?.elements?.group?.list || [];
    } catch {
      return [];
    }
  });
  const groups = lists.flat().filter((item, index, all) => all.findIndex((other) => other.value === item.value) === index);
  rudnGroupsCache = { expiresAt: Date.now() + ROOM_DIRECTORY_TTL_MS, groups };
  return groups;
}

const RUSSIAN_WEEKDAYS: Record<string, number> = {
  понедельник: 1,
  вторник: 2,
  среда: 3,
  четверг: 4,
  пятница: 5,
  суббота: 6,
  воскресенье: 7,
};

function dateAtWeekday(weekStart: Date, weekday: number): string {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + weekday - 1);
  return date.toISOString().slice(0, 10);
}

async function fetchRudnSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  if (filters.type !== 'group') {
    throw new ScheduleError('РУДН поддерживает поиск расписания по группе', 400, 'SCHEDULE_TYPE_UNSUPPORTED');
  }
  const definition = provider('rudn');
  const target = bestMatch(await rudnGroups(), filters.value, (item) => item.label);
  if (!target) throw new ScheduleError('Группа РУДН не найдена', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  const response = await upstreamFetch(
    `https://www.rudn.ru/api/v1/education/schedule?group=${encodeURIComponent(target.value)}`,
    {},
    'расписания РУДН',
  );
  const html = await response.text();
  const ranges = Array.from(
    html.matchAll(/edss__tab-date[^>]*>\s*(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/g),
  ).map((match) => ({
    startDay: Number(match[1]),
    startMonth: Number(match[2]),
    endDay: Number(match[3]),
    endMonth: Number(match[4]),
  }));
  const panes = html.match(/<div role="tabpanel"[\s\S]*?(?=<div role="tabpanel"|<\/section>|$)/g) || [];
  const items: ScheduleItem[] = [];
  for (const [paneIndex, pane] of panes.entries()) {
    const range = ranges[paneIndex];
    if (!range) continue;
    const year = Number(filters.dateFrom.slice(0, 4));
    const startYear = range.startMonth > range.endMonth ? year - 1 : year;
    const weekStart = new Date(Date.UTC(startYear, range.startMonth - 1, range.startDay));
    let weekday = 1;
    const rows = pane.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    for (const [rowIndex, row] of rows.entries()) {
      const heading = htmlText(row).toLocaleLowerCase('ru-RU');
      const headingDay = Object.entries(RUSSIAN_WEEKDAYS).find(([name]) => heading === name);
      if (headingDay) {
        weekday = headingDay[1];
        continue;
      }
      const cell = (className: string) => htmlText(row.match(new RegExp(`<td[^>]*${className}[^>]*>([\\s\\S]*?)<\\/td>`, 'i'))?.[1] || '');
      const time = cell('edss__table-time');
      const subject = cell('edss__table-subj');
      if (!time || !subject) continue;
      const [timeStart = '', timeEnd = ''] = time.split(/\s*-\s*/);
      items.push({
        id: `rudn-${target.value}-${paneIndex}-${rowIndex}`,
        date: dateAtWeekday(weekStart, weekday),
        timeStart,
        timeEnd,
        subject,
        teachers: [cell('edss__table-tutor')].filter(Boolean),
        rooms: [cell('edss__table-place')].filter(Boolean),
        lessonType: cell('edss__table-type'),
        groups: [target.label],
      });
    }
  }
  return resultFor(definition, filters, target.label, items);
}

async function fetchUrfuSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  if (filters.type === 'room') {
    throw new ScheduleError('УрФУ поддерживает поиск по группе или преподавателю', 400, 'SCHEDULE_TYPE_UNSUPPORTED');
  }
  const definition = provider('urfu');
  const collection = filters.type === 'group' ? 'groups' : 'teachers';
  const searchResponse = await upstreamFetch(
    `https://urfu.ru/api/v2/schedule/${collection}?search=${encodeURIComponent(filters.value)}`,
    {},
    'расписания УрФУ',
  );
  const candidates = (await searchResponse.json()) as Array<{ id: number; title?: string; fullName?: string; name?: string }>;
  const target = bestMatch(candidates || [], filters.value, (item) => item.title || item.fullName || item.name || '');
  if (!target) throw new ScheduleError('Объект расписания УрФУ не найден', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  const label = target.title || target.fullName || target.name || filters.value;
  const scheduleResponse = await upstreamFetch(
    `https://urfu.ru/api/v2/schedule/${collection}/${target.id}/schedule?date_gte=${filters.dateFrom}&date_lte=${filters.dateTo}`,
    {},
    'расписания УрФУ',
  );
  const payload = (await scheduleResponse.json()) as {
    events?: Array<{
      id: string;
      date: string;
      timeBegin?: string;
      timeEnd?: string;
      title?: string;
      loadType?: string;
      auditoryTitle?: string | null;
      auditoryLocation?: string | null;
      teacherName?: string | null;
      groupTitle?: string | null;
    }>;
  };
  const items = (payload.events || []).map((event) => ({
    id: `urfu-${event.id}`,
    date: event.date,
    timeStart: event.timeBegin?.slice(0, 5) || '',
    timeEnd: event.timeEnd?.slice(0, 5) || '',
    subject: event.title || 'Занятие',
    teachers: [event.teacherName || ''].filter(Boolean),
    rooms: [[event.auditoryTitle, event.auditoryLocation].filter(Boolean).join(', ')].filter(Boolean),
    lessonType: event.loadType || '',
    groups: [event.groupTitle || (filters.type === 'group' ? label : '')].filter(Boolean),
  }));
  return resultFor(definition, filters, label, items);
}

const URSMU_TIMES: Record<string, [string, string]> = {
  '1': ['08:30', '10:00'], '2': ['10:15', '11:45'], '3': ['12:15', '13:45'],
  '4': ['14:00', '15:30'], '5': ['15:40', '17:10'], '6': ['17:20', '18:55'],
  '7': ['18:55', '20:25'], '8': ['20:30', '22:00'],
};

async function fetchUrsmuSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  const definition = provider('ursmu');
  const pageResponse = await upstreamFetch(definition.sourceUrl, {}, 'расписания УГГУ');
  const html = await pageResponse.text();
  const token = html.match(/id=["']csrfToken["'][^>]*value=["']([^"']+)/i)?.[1];
  if (!token) throw new ScheduleError('УГГУ не вернул защитный токен', 502, 'SCHEDULE_UPSTREAM_ERROR');
  const optionName = { group: 'groupOption', teacher: 'teacherOption', room: 'kabOption' }[filters.type];
  const options = Array.from(html.matchAll(new RegExp(`<li[^>]*name=["']${optionName}["'][^>]*>([\\s\\S]*?)<\\/li>`, 'gi')))
    .map((match) => htmlText(match[1]));
  const selected = bestMatch(options, filters.value, (item) => item);
  if (!selected) throw new ScheduleError('Объект расписания УГГУ не найден', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  const type = { group: 'stud', teacher: 'teach', room: 'cab' }[filters.type];
  const url = new URL('https://www.ursmu.ru/api/getRaspInPeriod');
  url.search = new URLSearchParams({ name: selected, begin: filters.dateFrom, end: filters.dateTo, type, typeWeek: 'select', csrf_token: token }).toString();
  const headers: Record<string, string> = {};
  const cookie = pageResponse.headers.get('set-cookie')?.split(';')[0];
  if (cookie) headers.Cookie = cookie;
  const response = await upstreamFetch(url.toString(), { headers }, 'расписания УГГУ');
  const payload = (await response.json()) as Record<string, Array<{
    studGroup?: string; lesNum?: string | number; cab?: string; teacher?: string;
    subject?: string; type?: string;
  }>>;
  const items = Object.entries(payload).flatMap(([rawDate, lessons]) =>
    (lessons || []).map((lesson, index) => {
      const dateParts = rawDate.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/);
      const date = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : rawDate;
      const [timeStart = '', timeEnd = ''] = URSMU_TIMES[String(lesson.lesNum)] || [];
      return {
        id: `ursmu-${date}-${lesson.lesNum}-${index}`,
        date,
        timeStart,
        timeEnd,
        subject: lesson.subject || 'Занятие',
        teachers: [lesson.teacher || ''].filter(Boolean),
        rooms: [lesson.cab || ''].filter(Boolean),
        lessonType: lesson.type || '',
        groups: [lesson.studGroup || (filters.type === 'group' ? selected : '')].filter(Boolean),
      };
    }),
  );
  return resultFor(definition, filters, selected, items);
}

function parseKstuGroups(html: string): Array<{ id: string; label: string }> {
  return Array.from(html.matchAll(/document\.form2\.g\.value='(\d+)'[\s\S]*?title="Смотрим расписание"[^>]*>\s*([^<]+)</g))
    .map((match) => ({ id: match[1], label: htmlText(match[2]) }));
}

function parseKstuWeek(html: string, groupId: string, groupLabel: string): ScheduleItem[] {
  const header = html.match(/<table class="brstu-table"[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>/)?.[1] || '';
  const dates = Array.from(header.matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)).map((match) => `${match[3]}-${match[2]}-${match[1]}`);
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  const items: ScheduleItem[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    const time = htmlText(row.match(/\d+\s*пара\s*<br[^>]*>\s*([0-9:]+-[0-9:]+)/i)?.[1] || '');
    if (!time) continue;
    const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).slice(1);
    cells.forEach((cell, dayIndex) => {
      const content = cell[1];
      const room = htmlText(content.match(/<b>([^<]+)<\/b>/i)?.[1] || '');
      const lines = content.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1').split(/<br\s*\/?\s*>/i).map(htmlText).filter(Boolean);
      const subject = lines.find((line) => !line.match(/^\d{1,2}\s+[а-я]+\s*-\s*\d{1,2}\s+[а-я]+$/i) && line !== room);
      if (!subject || !dates[dayIndex]) return;
      const teacher = htmlText(content.match(/<a[^>]*www_Pgrid[^>]*>([\s\S]*?)<\/a>/i)?.[1] || '');
      const lessonType = subject.match(/\(([^)]+)\)\s*$/)?.[1] || '';
      items.push({
        id: `knitu-${groupId}-${dates[dayIndex]}-${rowIndex}-${dayIndex}`,
        date: dates[dayIndex],
        timeStart: time.split('-')[0],
        timeEnd: time.split('-')[1],
        subject: subject.replace(/\s*\([^)]+\)\s*$/, ''),
        teachers: [teacher].filter(Boolean),
        rooms: [room].filter(Boolean),
        lessonType,
        groups: [groupLabel],
      });
    });
  }
  return items;
}

async function fetchKnituSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  if (filters.type !== 'group') throw new ScheduleError('КНИТУ поддерживает поиск по группе', 400, 'SCHEDULE_TYPE_UNSUPPORTED');
  const definition = provider('knitu');
  const directoryResponse = await upstreamFetch(definition.sourceUrl, {}, 'расписания КНИТУ');
  const directory = await directoryResponse.text();
  const target = bestMatch(parseKstuGroups(directory), filters.value, (item) => item.label);
  if (!target) throw new ScheduleError('Группа КНИТУ не найдена', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  const weeks = dateAnchors(filters.dateFrom, filters.dateTo);
  const itemLists = await mapWithConcurrency(weeks, 3, async (date) => {
    const response = await upstreamFetch(
      `https://www.kstu.ru/www_Ggrid.jsp?g=${target.id}&d=${date}`,
      {},
      'расписания КНИТУ',
    );
    return parseKstuWeek(await response.text(), target.id, target.label);
  });
  const items = itemLists.flat().filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
  return resultFor(definition, filters, target.label, items);
}

async function fetchKfuSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  if (filters.type !== 'group') throw new ScheduleError('КФУ поддерживает поиск по группе', 400, 'SCHEDULE_TYPE_UNSUPPORTED');
  const definition = provider('kfu');
  const calendarYear = Number(filters.dateFrom.slice(0, 4));
  const month = Number(filters.dateFrom.slice(5, 7));
  const studyYear = String(month >= 7 ? calendarYear : calendarYear - 1);
  const semester = month >= 7 ? '1' : '2';
  const scheduleUrl = `${definition.sourceUrl}?p_study_year=${studyYear}&p_semester=${semester}`;
  const directoryResponse = await upstreamFetch(scheduleUrl, {}, 'расписания КФУ');
  const directory = new TextDecoder('windows-1251').decode(await directoryResponse.arrayBuffer());
  const groupSelect = directory.match(/<select[^>]*name=["']?p_group["']?[^>]*>([\s\S]*?)<\/select>/i)?.[1] || '';
  const groups = Array.from(groupSelect.matchAll(/<option value=["']?(\d+)["']?[^>]*>([^<]+)/gi))
    .map((match) => ({ id: match[1], label: htmlText(match[2]).replace(/\s*\([^)]*\)\s*$/, '') }))
    .filter((item) => item.label.length >= 3 && /\d/.test(item.label));
  const target = bestMatch(groups, filters.value, (item) => item.label);
  if (!target) throw new ScheduleError('Группа КФУ не найдена', 404, 'SCHEDULE_TARGET_NOT_FOUND');
  const body = new URLSearchParams({
    p_faculty: '0',
    p_qualification_type: '',
    p_speciality: '',
    p_course: '',
    p_group: target.id,
    p_poisk: '1',
    p_portal: '',
    p_not_top: '',
    p_sub: '',
    p_type_study: '',
  });
  const response = await upstreamFetch(
    `${scheduleUrl}&p_group=${target.id}`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body },
    'расписания КФУ',
  );
  const html = new TextDecoder('windows-1251').decode(await response.arrayBuffer());
  const items: ScheduleItem[] = [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const [index, row] of rows.entries()) {
    const text = htmlText(row);
    const dateMatch = text.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/);
    const timeMatch = text.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((match) => htmlText(match[1]));
    if (!dateMatch || !timeMatch || cells.length < 2) continue;
    items.push({
      id: `kfu-${target.id}-${index}`,
      date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
      timeStart: timeMatch[1],
      timeEnd: timeMatch[2],
      subject: cells.find((cell) => cell.length > 4 && !cell.includes(timeMatch[1])) || 'Занятие',
      teachers: [], rooms: [], lessonType: '', groups: [target.label],
    });
  }
  return resultFor(definition, filters, target.label, items);
}

async function fetchProviderSchedule(
  filters: z.infer<typeof getScheduleSchema>,
): Promise<ScheduleResult> {
  const definition = provider(filters.university);
  if (!definition.searchTypes.includes(filters.type)) {
    throw new ScheduleError('Этот вуз не поддерживает выбранный тип поиска', 400, 'SCHEDULE_TYPE_UNSUPPORTED');
  }
  switch (filters.university) {
    case 'spbstu': return fetchSpbstuSchedule(filters);
    case 'mirea': return fetchMireaSchedule(filters);
    case 'rudn': return fetchRudnSchedule(filters);
    case 'urfu': return fetchUrfuSchedule(filters);
    case 'ursmu': return fetchUrsmuSchedule(filters);
    case 'knitu': return fetchKnituSchedule(filters);
    case 'kfu': return fetchKfuSchedule(filters);
  }
}

router.get('/providers', (_req: Request, res: Response) => {
  const cities = Array.from(new Map(PROVIDERS.map((item) => [item.cityId, {
    id: item.cityId,
    name: item.cityName,
    universities: PROVIDERS
      .filter((candidate) => candidate.cityId === item.cityId)
      .map(({ id, name, sourceUrl, searchTypes }) => ({ id, name, sourceUrl, searchTypes })),
  }])).values());
  res.json({ success: true, data: { cities } });
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = getScheduleSchema.parse(req.query);
    const result = await fetchProviderSchedule(query);

    res.json({
      success: true,
      data: result,
      message: 'Расписание получено успешно',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Неверные параметры запроса',
        details: error.errors,
      });
      return;
    }

    if (error instanceof ScheduleError) {
      res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    });
  }
});

export default router;
