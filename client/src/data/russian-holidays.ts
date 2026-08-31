export type HolidayBreak = {
  id: string;
  nameKey: string;
  restStart: string;
  restEnd: string;
};

export type UpcomingHoliday = HolidayBreak & {
  isCurrent: boolean;
};

/** YYYY-MM-DD in Europe/Moscow — offices close on the Russian calendar. */
export function moscowYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Official rest periods 2026: ТК РФ ст. 112 + ПП РФ от 24.09.2025 № 1466.
 * restEnd inclusive. January 2027 transfers are not published yet — only statutory 1–8 Jan.
 */
export const RUSSIAN_HOLIDAY_BREAKS_2026: HolidayBreak[] = [
  {
    id: "new-year-2026",
    nameKey: "dashboard.holiday.name.newYear",
    restStart: "2025-12-31",
    restEnd: "2026-01-11",
  },
  {
    id: "defender-2026",
    nameKey: "dashboard.holiday.name.defender",
    restStart: "2026-02-21",
    restEnd: "2026-02-23",
  },
  {
    id: "women-2026",
    nameKey: "dashboard.holiday.name.women",
    restStart: "2026-03-07",
    restEnd: "2026-03-09",
  },
  {
    id: "labour-2026",
    nameKey: "dashboard.holiday.name.labour",
    restStart: "2026-05-01",
    restEnd: "2026-05-03",
  },
  {
    id: "victory-2026",
    nameKey: "dashboard.holiday.name.victory",
    restStart: "2026-05-09",
    restEnd: "2026-05-11",
  },
  {
    id: "russia-day-2026",
    nameKey: "dashboard.holiday.name.russia",
    restStart: "2026-06-12",
    restEnd: "2026-06-14",
  },
  {
    id: "unity-2026",
    nameKey: "dashboard.holiday.name.unity",
    restStart: "2026-11-04",
    restEnd: "2026-11-04",
  },
  {
    id: "new-year-2027",
    nameKey: "dashboard.holiday.name.newYear",
    restStart: "2026-12-31",
    restEnd: "2027-01-08",
  },
];

export const RUSSIAN_HOLIDAYS_GUIDE_ID = "russian-holidays";

export function getUpcomingHoliday(
  now = new Date(),
): UpcomingHoliday | null {
  const today = moscowYmd(now);
  const next = RUSSIAN_HOLIDAY_BREAKS_2026.find((breakPeriod) => breakPeriod.restEnd >= today);
  if (!next) return null;
  return {
    ...next,
    isCurrent: next.restStart <= today && today <= next.restEnd,
  };
}
