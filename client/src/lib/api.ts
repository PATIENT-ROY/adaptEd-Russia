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
  TestData
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

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
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка запроса');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
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

  // Напоминания
  async getReminders(): Promise<Reminder[]> {
    const response = await this.request<Reminder[]>('/reminders');
    return response.data!;
  }

  async createReminder(data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    const response = await this.request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
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
  async sendMessage(content: string): Promise<ChatMessage> {
    const response = await this.request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data!;
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
  const response = await fetch(`${API_BASE_URL}/payments/payment/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch payment');
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