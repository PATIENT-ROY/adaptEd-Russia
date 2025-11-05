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
      } catch (error: unknown) {
        // Не показываем ошибку, если пользователь не авторизован - он будет перенаправлен
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('токен') || errorMessage?.includes('token') || errorMessage?.includes('авториз')) {
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
        userId: userId,
        content: text,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Отправляем сообщение и получаем ответ AI
      const response = await apiClient.sendMessage(text);
      
      // Обновляем состояние с ответом AI
      // API возвращает объект с userMessage и aiMessage
      interface ChatResponse {
        userMessage?: ChatMessage;
        aiMessage?: ChatMessage;
      }
      
      if (response && typeof response === 'object' && 'aiMessage' in response) {
        // Если ответ в формате { userMessage, aiMessage }
        const chatResponse = response as ChatResponse;
        if (chatResponse.aiMessage) {
          setMessages(prev => [...prev, chatResponse.aiMessage!]);
        }
      } else if (response && typeof response === 'object' && 'id' in response) {
        // Если ответ - обычное сообщение
        setMessages(prev => [...prev, response as ChatMessage]);
      }

      return response;
    } catch (err: unknown) {
      console.error('Send message error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при отправке сообщения';
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