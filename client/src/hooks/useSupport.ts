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
      const response = await fetch('http://localhost:3003/api/support/contact', {
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
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3003/api/support/faq');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при получении FAQ');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getContactInfo = async (): Promise<ContactInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3003/api/support/contact-info');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при получении контактной информации');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
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