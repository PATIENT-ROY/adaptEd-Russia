import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface SupportFormData {
  name: string;
  email: string;
  category: 'GENERAL' | 'CONTENT_ERROR';
  subject: string;
  message: string;
}

interface SupportResponse {
  success: boolean;
  message: string;
  errors?: unknown[];
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  emergencySupport: string;
}

export const useSupport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSupportForm = async (formData: SupportFormData): Promise<SupportResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = response.status === 400
          ? 'api.error.badRequest'
          : response.status === 401
            ? 'api.error.unauthorized'
            : response.status === 429
              ? 'api.error.tooManyRequests'
              : 'support.form.error.generic';
        throw new Error(errorKey);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof TypeError
        ? 'api.error.connection'
        : err instanceof Error && /^(api\.error\.|support\.form\.error\.)/.test(err.message)
          ? err.message
          : 'support.form.error.generic';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getFAQ = async (): Promise<FAQItem[]> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/support/faq`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при получении FAQ');
      }

      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('FAQ loading error:', err);
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  };

  const getContactInfo = async (): Promise<ContactInfo> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/support/contact-info`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при получении контактной информации');
      }

      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Contact info loading error:', err);
      throw err;
    }
  };

  return {
    submitSupportForm,
    getFAQ,
    getContactInfo,
    isLoading,
    error,
  };
};
