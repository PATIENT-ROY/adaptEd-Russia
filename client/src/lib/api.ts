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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

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
      console.log(`API request - ${options.method || 'GET'} ${url}`);
      console.log('API request - Headers:', headers);
      console.log('API request - Body:', options.body);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('API request - Response status:', response.status);
      console.log('API request - Response ok:', response.ok);
      console.log('API request - Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        const text = await response.text();
        console.log('API request - Response text:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('API request - JSON parse error:', parseError);
        throw new Error('Не удалось распарсить ответ сервера');
      }

      console.log('API request - Parsed data:', data);
      console.log('API request - Data type:', typeof data);
      console.log('API request - Data keys:', data ? Object.keys(data) : 'null');

      if (!response.ok) {
        console.error('API request - Error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });
        
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
      console.error('API request error:', error);
      if (error instanceof Error) {
        console.error('API request error message:', error.message);
        console.error('API request error stack:', error.stack);
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
    console.log('API getReminders response:', response);
    console.log('API getReminders data:', response.data);
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log('First reminder from API:', {
        id: response.data[0].id,
        title: response.data[0].title,
        dueDate: response.data[0].dueDate,
        dueDateType: typeof response.data[0].dueDate,
        category: response.data[0].category,
        allFields: Object.keys(response.data[0]),
        fullReminder: response.data[0],
      });
    }
    return response.data!;
  }

  async createReminder(data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Reminder> {
    console.log('API createReminder - Sending data:', JSON.stringify(data, null, 2));
    
    const response = await this.request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('API createReminder - Full response:', response);
    console.log('API createReminder - Response type:', typeof response);
    console.log('API createReminder - Response keys:', response ? Object.keys(response) : 'null');
    console.log('API createReminder - Response stringified:', JSON.stringify(response, null, 2));
    console.log('API createReminder - response.success:', response?.success);
    console.log('API createReminder - response.data:', response?.data);
    console.log('API createReminder - response.data type:', typeof response?.data);
    console.log('API createReminder - response.data keys:', response?.data ? Object.keys(response.data) : 'null');
    
    // Определяем, где находятся данные: в response.data или в response напрямую
    let reminder: Reminder | undefined;
    
    if (response?.data) {
      // Стандартный формат: { success: true, data: {...} }
      reminder = response.data;
      console.log('API createReminder - Using response.data');
    } else if (response && typeof response === 'object' && 'id' in response && 'title' in response) {
      // Если response сам является объектом напоминания
      reminder = response as unknown as Reminder;
      console.log('API createReminder - Using response directly (it is the reminder object)');
    }
    
    // Проверяем, что данные есть
    if (!reminder || !reminder.id) {
      console.error('⚠️ ERROR: No valid reminder data found!');
      console.error('⚠️ Full response object:', JSON.stringify(response, null, 2));
      console.error('⚠️ reminder:', reminder);
      throw new Error('Сервер вернул некорректные данные. Проверьте логи консоли и сервера.');
    }
    
    console.log('API createReminder - Reminder object:', reminder);
    console.log('API createReminder - Reminder stringified:', JSON.stringify(reminder, null, 2));
    console.log('API createReminder - Reminder dueDate:', reminder.dueDate);
    console.log('API createReminder - Reminder category:', reminder.category);
    console.log('API createReminder - Reminder keys:', Object.keys(reminder));
    
    // Проверяем, что reminder не пустой объект
    if (Object.keys(reminder).length === 0) {
      console.error('⚠️ ERROR: reminder is empty object!');
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

export const fetchProfileOverview = async (): Promise<ProfileOverview> => {
  if (typeof (apiClient as any).getProfileOverview === "function") {
    return apiClient.getProfileOverview();
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_BASE_URL}/user/profile/overview`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to fetch profile overview: ${response.status}`
    );
  }

  const payload: ApiResponse<ProfileOverview> = await response.json();

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Не удалось получить профиль");
  }

  return payload.data;
};

export const fetchDashboardOverview = async (): Promise<DashboardOverview> => {
  if (typeof (apiClient as any).getDashboardOverview === "function") {
    return apiClient.getDashboardOverview();
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to fetch dashboard overview: ${response.status}`
    );
  }

  const payload: ApiResponse<DashboardOverview> = await response.json();

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Не удалось получить данные дашборда");
  }

  return payload.data;
};

export const fetchAchievementsOverview = async (): Promise<AchievementsOverview> => {
  if (typeof (apiClient as any).getAchievementsOverview === "function") {
    return apiClient.getAchievementsOverview();
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_BASE_URL}/user/achievements`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to fetch achievements overview: ${response.status}`
    );
  }

  const payload: ApiResponse<AchievementsOverview> = await response.json();

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Не удалось получить достижения");
  }

  return payload.data;
};

// Экспортируем типы для удобства
export type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, UpdateProfileRequest }; 

// Payment API functions
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  console.log('Fetching subscription plans from:', `${API_BASE_URL}/payments/plans`);
  try {
    const response = await fetch(`${API_BASE_URL}/payments/plans`);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch subscription plans: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Subscription plans received:', data);
    return data;
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    throw error;
  }
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
  
  console.log('Fetching payment:', { paymentId, hasToken: !!token });
  
  const response = await fetch(`${API_BASE_URL}/payments/payment/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  console.log('Payment response:', { 
    status: response.status, 
    ok: response.ok,
    statusText: response.statusText 
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Payment fetch error:', errorData);
    throw new Error(errorData.error || `Failed to fetch payment: ${response.status} ${response.statusText}`);
  }
  
  const payment = await response.json();
  console.log('Payment fetched:', { id: payment.id, status: payment.status });
  return payment;
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
  
  if (!token) {
    console.log('No token found, skipping subscription fetch');
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/payments/subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      console.log('Unauthorized, user not logged in');
      return null;
    }
    
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

export const getPaymentHistory = async (): Promise<Payment[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    console.log('No token found, skipping payment history fetch');
    return [];
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      console.log('Unauthorized, user not logged in');
      return [];
    }
    
    if (!response.ok) throw new Error('Failed to fetch payment history');
    return response.json();
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

export const getTestData = async (): Promise<TestData> => {
  console.log('Fetching test data from:', `${API_BASE_URL}/payments/test-data`);
  try {
    const response = await fetch(`${API_BASE_URL}/payments/test-data`);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch test data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Test data received:', data);
    return data;
  } catch (error) {
    console.error('Error in getTestData:', error);
    throw error;
  }
}; 