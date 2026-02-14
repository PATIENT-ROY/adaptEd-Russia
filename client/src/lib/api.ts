import { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  UpdateProfileRequest,
  Reminder,
  Guide,
  ChatMessage,
  SubscriptionPlan,
  PaymentRequest,
  PaymentResponse,
  Payment,
  Subscription,
  TestData,
  ProfileOverview,
  DashboardOverview,
  AchievementsOverview
} from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:56548/api';

// Логирование только в development
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log.bind(console) : () => {};
const logWarn = isDev ? console.warn.bind(console) : () => {};
const logError = console.error.bind(console); // Ошибки всегда логируем

// Интерфейс для ответа чата
interface ChatMessageResponse {
  userMessage?: ChatMessage;
  aiMessage?: ChatMessage;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (!this.token && typeof window !== 'undefined') {
      this.loadToken();
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      log(`API request - ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      log('API request - Response status:', response.status);

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logError('API request - JSON parse error:', parseError);
        throw new Error('Не удалось распарсить ответ сервера');
      }

      if (!response.ok) {
        logError('API request - Error response:', response.status, data?.error);
        
        // Если недействительный токен, очищаем его
        if (response.status === 401 || data.error?.includes('токен') || data.error?.includes('token')) {
          this.clearToken();
          // Перенаправляем на страницу входа только если это не страница входа
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        throw new Error(data.error || data.message || 'Ошибка запроса');
      }

      return data;
    } catch (error) {
      logError('API request error:', error);
      
      // Обработка ошибок подключения
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const connectionError = new Error('Сервер недоступен. Убедитесь, что бэкенд запущен.');
        connectionError.name = 'ConnectionError';
        logWarn('API connection error - server may be down');
        throw connectionError;
      }
      
      throw error;
    }
  }

  // Аутентификация
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async verifyToken(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/verify');
    return response.data!.user;
  }

  logout() {
    this.clearToken();
  }

  // Пользователи
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getUserProfile(): Promise<User> {
    const response = await this.request<User>('/user/profile');
    return response.data!;
  }

  async getProfileOverview(): Promise<ProfileOverview> {
    const response = await this.request<ProfileOverview>('/user/profile/overview');
    return response.data!;
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.request<DashboardOverview>('/user/dashboard');
    return response.data!;
  }

  async getAchievementsOverview(): Promise<AchievementsOverview> {
    const response = await this.request<AchievementsOverview>('/user/achievements');
    return response.data!;
  }

  // Напоминания
  async getReminders(): Promise<Reminder[]> {
    const response = await this.request<Reminder[]>('/reminders');
    return response.data!;
  }

  async createReminder(data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Reminder> {
    log('API createReminder - Sending data:', data.title);
    
    const response = await this.request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Определяем, где находятся данные: в response.data или в response напрямую
    let reminder: Reminder | undefined;
    
    if (response?.data) {
      reminder = response.data;
    } else if (response && typeof response === 'object' && 'id' in response && 'title' in response) {
      reminder = response as unknown as Reminder;
    }
    
    if (!reminder || !reminder.id) {
      logError('createReminder: No valid reminder data in response');
      throw new Error('Сервер вернул некорректные данные');
    }
    
    if (Object.keys(reminder).length === 0) {
      throw new Error('Получен пустой объект напоминания от сервера');
    }
    
    return reminder;
  }

  async updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const response = await this.request<Reminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteReminder(id: string): Promise<void> {
    await this.request(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // Гайды
  async getGuides(category?: string, language?: string): Promise<Guide[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (language) params.append('language', language);

    const response = await this.request<Guide[]>(`/guides?${params.toString()}`);
    return response.data!;
  }

  async getGuide(id: string): Promise<Guide> {
    const response = await this.request<Guide>(`/guides/${id}`);
    return response.data!;
  }

  // Чат
  async sendMessage(content: string): Promise<ChatMessageResponse | ChatMessage> {
    const response = await this.request<ChatMessageResponse | ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    // API возвращает { userMessage, aiMessage } или ChatMessage
    const data = response.data || response;
    return data as ChatMessageResponse | ChatMessage;
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const response = await this.request<ChatMessage[]>('/chat/messages');
    return response.data!;
  }

  // Проверка подключения
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
    return response.json();
  }
}

// Создаем единственный экземпляр API клиента
export const apiClient = new ApiClient(API_BASE_URL);

// Обёртки для совместимости с существующим кодом
export const fetchProfileOverview = () => apiClient.getProfileOverview();
export const fetchDashboardOverview = () => apiClient.getDashboardOverview();
export const fetchAchievementsOverview = () => apiClient.getAchievementsOverview();

// Экспортируем типы для удобства
export type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, UpdateProfileRequest }; 

// Payment API functions
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${API_BASE_URL}/payments/plans`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription plans: ${response.status}`);
  }
  
  return response.json();
};

export const createPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }
  
  const response = await fetch(`${API_BASE_URL}/payments/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (response.status === 401) {
    throw new Error('Authentication required. Please log in first.');
  }
  
  if (!response.ok) {
    throw new Error(`Failed to create payment: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const getPayment = async (paymentId: string): Promise<Payment> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const response = await fetch(`${API_BASE_URL}/payments/payment/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch payment: ${response.status}`);
  }
  
  return response.json();
};

export const cancelPayment = async (paymentId: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${API_BASE_URL}/payments/payment/${paymentId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to cancel payment');
};

export const getSubscription = async (): Promise<Subscription | null> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/payments/subscription`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  } catch {
    return null;
  }
};

export const getPaymentHistory = async (): Promise<Payment[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) return [];
  
  try {
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status === 401) return [];
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  } catch {
    return [];
  }
};

export const getTestData = async (): Promise<TestData> => {
  const response = await fetch(`${API_BASE_URL}/payments/test-data`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch test data: ${response.status}`);
  }
  
  return response.json();
}; 