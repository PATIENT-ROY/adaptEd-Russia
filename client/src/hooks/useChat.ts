import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { ChatMessage } from '@/types';

export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
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
        const data = await apiClient.getChatHistory();
        
        if (isMountedRef.current) {
          setMessages(data);
          setError(null);
        }
      } catch (error: unknown) {
        if (!isMountedRef.current) return;
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage?.includes('токен') || 
            errorMessage?.includes('token') || 
            errorMessage?.includes('авториз') ||
            errorMessage?.includes('Сеанс')) {
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

  const sendMessage = useCallback(async (text: string) => {
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
      
      setMessages(prev => [...prev, userMessage]);

      const response = await apiClient.sendMessage(text);
      
      if (!isMountedRef.current) return;
      
      interface ChatResponse {
        userMessage?: ChatMessage;
        aiMessage?: ChatMessage;
        content?: string;
      }
      
      if (response && typeof response === 'object') {
        if ('aiMessage' in response) {
          const chatResponse = response as ChatResponse;
          if (chatResponse.aiMessage) {
            setMessages(prev => [...prev, chatResponse.aiMessage as ChatMessage]);
          }
        } else if ('content' in response) {
          const chatResponse = response as ChatResponse;
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            userId: 'ai',
            content: chatResponse.content || '',
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else if ('id' in response) {
          setMessages(prev => [...prev, response as ChatMessage]);
        }
      }

      return response;
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error('Send message error:', err);
      
      let errorMessage = 'Не удалось отправить сообщение';
      
      if (err instanceof Error) {
        if (err.message.includes('подключения') || err.message.includes('Connection')) {
          errorMessage = 'Нет подключения к серверу. Проверьте интернет';
        } else if (err.message.includes('429') || err.message.includes('много')) {
          errorMessage = 'Слишком много запросов. Подождите немного';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      pendingRequestRef.current = null;
    }
  }, [userId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    isInitializing,
    sendMessage,
    clearChat,
    clearError,
  };
}
