import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { ChatMessage, RelatedGuide, ChatUsage } from '@/types';

export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [lastRelatedGuides, setLastRelatedGuides] = useState<RelatedGuide[]>([]);
  const [lastAiMessageId, setLastAiMessageId] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const pendingRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchMessages = async () => {
      if (!userId) {
        setIsInitializing(false);
        return;
      }

      try {
        const result = await apiClient.getChatHistory();

        if (isMountedRef.current) {
          setMessages(result.messages);
          if (result.usage) setUsage(result.usage);
          setError(null);
        }
      } catch (error: unknown) {
        if (!isMountedRef.current) return;

        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage?.includes('токен') ||
          errorMessage?.includes('token') ||
          errorMessage?.includes('авториз') ||
          errorMessage?.includes('Сеанс')
        ) {
          return;
        }

        console.error('Chat history error:', error);
        setMessages([]);
      } finally {
        if (isMountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isMountedRef.current = false;
    };
  }, [userId]);

  const sendMessage = useCallback(async (text: string, mode?: string) => {
    if (!text.trim()) {
      setError('Введите сообщение');
      return;
    }

    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
    }

    pendingRequestRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      userId: userId,
      content: text,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    try {
      setLoading(true);
      setError(null);
      setLimitError(null);

      setMessages(prev => [...prev, userMessage]);

      const response = await apiClient.sendMessage(text, mode);

      if (!isMountedRef.current) return;

      if (response.usage) {
        setUsage(response.usage);
      }

      if (response.relatedGuides?.length) {
        setLastRelatedGuides(response.relatedGuides);
      } else {
        setLastRelatedGuides([]);
      }

      if (response.aiMessage) {
        setLastAiMessageId(response.aiMessage.id);
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== userMessage.id);
          const msgs: ChatMessage[] = [...withoutTemp];
          if (response.userMessage) msgs.push(response.userMessage);
          msgs.push(response.aiMessage as ChatMessage);
          return msgs;
        });
      } else if (response.userMessage) {
        setMessages(prev =>
          prev.map(m => m.id === userMessage.id ? response.userMessage! : m)
        );
      }

      return response;
    } catch (err: unknown) {
      if (!isMountedRef.current) return;

      if (err instanceof Error && err.name === 'AbortError') return;

      console.error('Send message error:', err);

      let errorMessage = 'Не удалось отправить сообщение';

      if (err instanceof Error) {
        if (err.message.includes('LIMIT_FREEMIUM') || err.message.includes('429')) {
          setLimitError('FREEMIUM');
          errorMessage = '';
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          return;
        }
        if (err.message.includes('LIMIT_PREMIUM')) {
          setLimitError('PREMIUM');
          errorMessage = '';
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          return;
        }
        if (err.message.includes('подключения') || err.message.includes('Connection')) {
          errorMessage = 'Нет подключения к серверу. Проверьте интернет';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      if (errorMessage) setError(errorMessage);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));

      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      pendingRequestRef.current = null;
    }
  }, [userId]);

  const clearChat = useCallback(async () => {
    try {
      await apiClient.clearChatHistory();
    } catch (err) {
      console.error('Failed to clear chat on server:', err);
    }
    setMessages([]);
    setError(null);
    setLastRelatedGuides([]);
    setLastAiMessageId(null);
    setLimitError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const dismissLimitError = useCallback(() => {
    setLimitError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    isInitializing,
    usage,
    lastRelatedGuides,
    lastAiMessageId,
    limitError,
    sendMessage,
    clearChat,
    clearError,
    dismissLimitError,
  };
}
