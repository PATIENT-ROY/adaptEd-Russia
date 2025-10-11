import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { ChatMessage } from '@/types';

export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await apiClient.getChatHistory();
        setMessages(data);
        setError(null);
      } catch {
        setError('Ошибка при загрузке сообщений');
      }
    };

    if (userId) {
      fetchMessages();
    }
  }, [userId]);

  const sendMessage = async (text: string) => {
    try {
      setLoading(true);
      setError(null);

      // Отправляем сообщение и получаем ответ AI
      const response = await apiClient.sendMessage(text);
      
      // Обновляем состояние с новым сообщением
      setMessages(prev => [...prev, response]);

      return response;
    } catch (err) {
      setError('Ошибка при отправке сообщения');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  };
} 