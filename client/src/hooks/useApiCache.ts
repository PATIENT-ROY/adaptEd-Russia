import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Глобальный кэш для данных
const cache = new Map<string, CacheEntry<unknown>>();

// Время жизни кэша по умолчанию (5 минут)
const DEFAULT_TTL = 5 * 60 * 1000;

interface UseApiCacheOptions {
  /** Время жизни кэша в миллисекундах */
  ttl?: number;
  /** Автоматически перезапрашивать данные */
  revalidateOnFocus?: boolean;
  /** Зависимости для перезапроса */
  deps?: unknown[];
}

interface UseApiCacheResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: (newData?: T) => void;
  revalidate: () => Promise<void>;
}

/**
 * Хук для кэширования API запросов
 * Простая альтернатива SWR без внешних зависимостей
 */
export function useApiCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseApiCacheOptions = {}
): UseApiCacheResult<T> {
  const { ttl = DEFAULT_TTL, revalidateOnFocus = false, deps = [] } = options;
  
  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    const cached = cache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!data);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!key) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      
      if (isMounted.current) {
        setData(result);
        cache.set(key, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [key, fetcher]);

  // Начальная загрузка
  useEffect(() => {
    if (!key) return;
    
    const cached = cache.get(key) as CacheEntry<T> | undefined;
    const isStale = !cached || Date.now() - cached.timestamp >= ttl;
    
    if (isStale) {
      fetchData();
    }
  }, [key, ttl, fetchData, ...deps]);

  // Ревалидация при фокусе окна
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => {
      if (key) {
        const cached = cache.get(key) as CacheEntry<T> | undefined;
        if (!cached || Date.now() - cached.timestamp >= ttl) {
          fetchData();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, ttl, revalidateOnFocus, fetchData]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
      if (key) {
        cache.set(key, { data: newData, timestamp: Date.now() });
      }
    } else {
      fetchData();
    }
  }, [key, fetchData]);

  const revalidate = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, error, isLoading, mutate, revalidate };
}

/**
 * Очистить весь кэш
 */
export function clearApiCache(): void {
  cache.clear();
}

/**
 * Очистить конкретный ключ из кэша
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

