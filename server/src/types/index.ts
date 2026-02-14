// Enums
export enum Language {
  RU = 'RU',
  EN = 'EN',
  FR = 'FR',
  AR = 'AR',
  ZH = 'ZH'
}

export enum Role {
  STUDENT = 'student',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum Plan {
  FREEMIUM = 'freemium',
  PREMIUM = 'premium'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum ReminderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ReminderCategory {
  EDUCATION = 'EDUCATION',
  LIFE = 'LIFE',
  DOCUMENTS = 'DOCUMENTS',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER'
}

export enum GuideCategory {
  EDUCATION = 'EDUCATION',
  LIFE = 'LIFE',
  DOCUMENTS = 'DOCUMENTS',
  HEALTH = 'HEALTH',
  CULTURE = 'CULTURE',
  LEGAL = 'LEGAL',
  FINANCIAL = 'FINANCIAL',
  OTHER = 'OTHER'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Interfaces
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  language: Language;
  country: string;
  university?: string;
  faculty?: string;
  year?: string;
  plan: Plan;
  phone?: string;
  gender?: Gender;
  registeredAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  avatar?: string;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: ReminderPriority;
  status: ReminderStatus;
  category: ReminderCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guide {
  id: string;
  title: string;
  content: string;
  category: GuideCategory;
  language: Language;
  difficulty: Difficulty;
  tags: string[];
  isPublished: boolean;
  views: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Admin {
  id: string;
  userId: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  yooKassaPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  SBP = 'SBP',
  WALLET = 'WALLET'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING'
}

export enum SubscriptionInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

// YooKassa types
export interface YooKassaPaymentRequest {
  amount: {
    value: string;
    currency: string;
  };
  capture: boolean;
  confirmation: {
    type: 'redirect' | 'embedded';
    return_url?: string;
  };
  description: string;
  metadata?: Record<string, string>;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    confirmation_url?: string;
  };
  created_at: string;
  description: string;
  metadata?: Record<string, string>;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  language: Language;
  country: string;
}

export interface UpdateProfileRequest {
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: Gender;
} 