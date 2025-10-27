/**
 * Форматирование даты в едином формате для сервера и клиента
 * Предотвращает ошибки Hydration
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Форматируем вручную для одинакового результата на сервере и клиенте
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
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

