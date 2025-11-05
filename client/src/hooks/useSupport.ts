import { useState } from 'react';

interface SupportFormData {
  name: string;
  email: string;
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
      const response = await fetch(`${API_BASE_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при отправке формы');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getFAQ = async (): Promise<FAQItem[]> => {
    setError(null);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
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