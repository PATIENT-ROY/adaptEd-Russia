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
 * Хук для кэширования API запросов с поддержкой AbortController
 * Простая альтернатива SWR без внешних зависимостей
 */
export function useApiCache<T>(
  key: string | null,
  fetcher: (signal?: AbortSignal) => Promise<T>,
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
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Основная функция загрузки с AbortController
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!key) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher(signal);
      
      // Проверяем что компонент ещё смонтирован и запрос не отменён
      if (isMountedRef.current && !signal?.aborted) {
        setData(result);
        cache.set(key, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      // Игнорируем ошибки отменённых запросов
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current && !signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [key, fetcher]);

  // Начальная загрузка и загрузка при изменении зависимостей
  useEffect(() => {
    if (!key) return;
    
    const cached = cache.get(key) as CacheEntry<T> | undefined;
    const isStale = !cached || Date.now() - cached.timestamp >= ttl;
    
    if (isStale) {
      // Отменяем предыдущий запрос если есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Создаём новый AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      fetchData(controller.signal);
    }
    
    // Cleanup: отменяем запрос при размонтировании
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttl, fetchData, ...deps]);

  // Ревалидация при фокусе окна
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;
    
    const handleFocus = () => {
      const cached = cache.get(key) as CacheEntry<T> | undefined;
      if (!cached || Date.now() - cached.timestamp >= ttl) {
        // Отменяем предыдущий запрос
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetchData(controller.signal);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, ttl, revalidateOnFocus, fetchData]);

  // Cleanup при размонтировании компонента
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Отменяем все текущие запросы
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
      if (key) {
        cache.set(key, { data: newData, timestamp: Date.now() });
      }
    } else {
      // Отменяем предыдущий запрос и делаем новый
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchData(controller.signal);
    }
  }, [key, fetchData]);

  const revalidate = useCallback(async () => {
    if (!key) return;
    
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    await fetchData(controller.signal);
  }, [key, fetchData]);

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
