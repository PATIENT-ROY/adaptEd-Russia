export enum Role {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN",
  GUEST = "GUEST",
}

export enum Language {
  RU = "RU",
  EN = "EN",
  FR = "FR",
  AR = "AR",
}

export enum Plan {
  FREEMIUM = "FREEMIUM",
  PREMIUM = "PREMIUM",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum ReminderPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum ReminderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ReminderCategory {
  EDUCATION = "EDUCATION",
  LIFE = "LIFE",
  DOCUMENTS = "DOCUMENTS",
  HEALTH = "HEALTH",
  OTHER = "OTHER",
}

export enum GuideCategory {
  EDUCATION = "EDUCATION",
  LIFE = "LIFE",
  DOCUMENTS = "DOCUMENTS",
  CULTURE = "CULTURE",
  LEGAL = "LEGAL",
  OTHER = "OTHER",
}

export enum Difficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  language: Language;
  plan: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  category: ReminderCategory;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  title: string;
  content: string;
  category: GuideCategory;
  difficulty: Difficulty;
  language: Language;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SupportResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  emergencySupport: string;
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  language?: Language;
  role?: Role;
  plan?: Plan;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  language?: Language;
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
} 