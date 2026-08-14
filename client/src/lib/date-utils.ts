/**
 * Форматирование даты в едином формате для сервера и клиента.
 * YYYY-MM-DD парсим как календарную дату (без TZ-сдвига).
 */
export function formatDate(dateString: string | Date): string {
  if (typeof dateString === "string") {
    const isoDay = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDay) {
      const [, year, month, day] = isoDay;
      return `${day}.${month}.${year}`;
    }
  }

  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Получить полную дату (день месяц год)
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Получить текущую дату в формате ISO
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString();
}

