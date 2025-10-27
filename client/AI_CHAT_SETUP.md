# 🔧 Настройка AI Chat без авторизации (для тестирования)

## Проблема
Ошибка "Недействительный токен" возникает потому, что AI-чат требует авторизации.

## Решение 1: Войдите в систему
1. Перейдите на `/login`
2. Войдите или зарегистрируйтесь
3. Потом используйте `/ai-helper`

## Решение 2: Создайте тестовую версию без авторизации

Если хотите тестировать AI без авторизации, временно отключите проверку:

### 1. Измените `ai-helper/page.tsx`:

Удалите `<ProtectedRoute>` обёртку:

```typescript
// Было:
return (
  <ProtectedRoute>
    <Layout>
      ...
    </Layout>
  </ProtectedRoute>
);

// Стало:
return (
  <Layout>
    ...
  </Layout>
);
```

### 2. Измените `useChat.ts`:

```typescript
// Замените userId на тестовый ID
export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Используем тестовый ID
  const testUserId = 'test-user-123';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Не загружаем историю для теста
        setMessages([]);
        setError(null);
      } catch (error) {
        console.error('Chat history error:', error);
        setMessages([]);
      }
    };

    if (testUserId) {
      fetchMessages();
    }
  }, [testUserId]);
  
  // ... остальной код
}
```

### 3. Создайте упрощённый API для теста:

Добавьте в `server/src/api/chat.ts`:

```typescript
// Тестовый эндпоинт без авторизации
router.post('/messages/test', async (req: Request, res: Response) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    
    // Генерируем ответ AI
    const aiResponse = await generateAIResponse(validatedData.content);
    
    res.status(201).json({
      success: true,
      data: {
        userMessage: {
          id: Date.now().toString(),
          content: validatedData.content,
          isUser: true,
          timestamp: new Date().toISOString(),
        },
        aiMessage: {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      },
      message: 'Сообщение отправлено успешно'
    } as ApiResponse);
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});
```

## Рекомендация
**Лучше всего: Зарегистрируйтесь и войдите в систему** - это займёт 1 минуту и даст полноценный доступ ко всем функциям!

## Тестовые данные для входа
Если нужно быстро войти, используйте:
- Email: test@test.com
- Password: test123

(Но сначала создайте эту учётную запись через `/register`)

