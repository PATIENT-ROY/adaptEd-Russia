/**
 * Утилита для управления и ротации DeepSeek API ключей
 */

// Список API ключей DeepSeek
// Замените эти ключи на реальные, полученные с https://platform.deepseek.com
const DEEPSEEK_API_KEYS = [
  'sk-f526651b868e40578052d36218688a94',
];

// Трекер для отслеживания проблемных ключей
const failedKeys = new Set<string>();
let currentKeyIndex = 0;

/**
 * Получить следующий доступный API ключ
 */
export function getNextApiKey(): string | null {
  // Если список пуст, возвращаем null
  if (DEEPSEEK_API_KEYS.length === 0) {
    return null;
  }

  // Если все ключи в списке failedKeys, очищаем его и начинаем заново
  if (failedKeys.size >= DEEPSEEK_API_KEYS.length) {
    console.warn('Все API ключи исчерпаны, очищаем список failedKeys и начинаем заново');
    failedKeys.clear();
    currentKeyIndex = 0;
  }

  // Пробуем найти рабочий ключ
  let attempts = 0;
  while (attempts < DEEPSEEK_API_KEYS.length) {
    const key = DEEPSEEK_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % DEEPSEEK_API_KEYS.length;

    if (!failedKeys.has(key)) {
      return key;
    }

    attempts++;
  }

  // Если все ключи в failedKeys, возвращаем первый (после очистки failedKeys)
  return DEEPSEEK_API_KEYS[0];
}

/**
 * Пометить ключ как нерабочий
 */
export function markKeyAsFailed(key: string): void {
  failedKeys.add(key);
  console.warn(`DeepSeek API ключ помечен как нерабочий: ${key.substring(0, 10)}...`);
}

/**
 * Сбросить статус ключа (если он снова заработал)
 */
export function resetKey(key: string): void {
  failedKeys.delete(key);
  console.log(`DeepSeek API ключ сброшен и снова доступен: ${key.substring(0, 10)}...`);
}

/**
 * Получить количество доступных ключей
 */
export function getAvailableKeysCount(): number {
  return DEEPSEEK_API_KEYS.length - failedKeys.size;
}

/**
 * Получить общее количество ключей
 */
export function getTotalKeysCount(): number {
  return DEEPSEEK_API_KEYS.length;
}

