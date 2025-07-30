import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Guide } from '@/types';

export function useGuides(category?: string, language?: string) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getGuides(category, language);
        setGuides(data);
        setError(null);
      } catch {
        setError('Ошибка при загрузке гайдов');
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [category, language]);

  const searchGuides = async (query: string) => {
    try {
      setLoading(true);
      // Для поиска используем тот же метод getGuides, но можно добавить параметр поиска
      const results = await apiClient.getGuides();
      const filteredResults = results.filter(guide => 
        guide.title.toLowerCase().includes(query.toLowerCase()) ||
        guide.content.toLowerCase().includes(query.toLowerCase())
      );
      setGuides(filteredResults);
      setError(null);
    } catch {
      setError('Ошибка при поиске гайдов');
    } finally {
      setLoading(false);
    }
  };

  return {
    guides,
    loading,
    error,
    searchGuides,
  };
} 