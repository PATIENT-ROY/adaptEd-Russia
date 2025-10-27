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
      } catch (error: any) {
        // Не показываем ошибку, если пользователь не авторизован - он будет перенаправлен
        if (error.message?.includes('токен') || error.message?.includes('token') || error.message?.includes('авториз')) {
          // Перенаправление уже произошло в apiClient
          return;
        }
        console.error('Chat history error:', error);
        // Не показываем ошибку пользователю, просто инициализируем пустой чат
        setMessages([]);
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

      // Добавляем сообщение пользователя сразу
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: text,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Отправляем сообщение и получаем ответ AI
      const response = await apiClient.sendMessage(text);
      
      // Обновляем состояние с ответом AI
      // API возвращает объект с userMessage и aiMessage
      if (response && typeof response === 'object' && 'aiMessage' in response) {
        // Если ответ в формате { userMessage, aiMessage }
        setMessages(prev => [...prev, (response as any).aiMessage]);
      } else {
        // Если ответ - обычное сообщение
        setMessages(prev => [...prev, response as ChatMessage]);
      }

      return response;
    } catch (err: any) {
      console.error('Send message error:', err);
      const errorMessage = err.message || 'Ошибка при отправке сообщения';
      setError(errorMessage);
      
      // Убираем последнее сообщение пользователя, если отправка не удалась
      setMessages(prev => prev.slice(0, -1));
      
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