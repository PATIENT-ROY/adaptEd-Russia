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
  ZH = "ZH",
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
  country?: string;
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  city?: string;
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
  notificationMethod: string;
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
  country?: string;
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
  gender?: "MALE" | "FEMALE";
}

export interface ProfileStat {
  id: string;
  title: string;
  value: string;
  change?: string;
  period?: string;
  icon: string;
  color: string;
}

export interface ProfileQuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

export type ProfileActivityType = "guide" | "reminder" | "ai" | "task" | "payment";

export interface ProfileActivityItem {
  id: string;
  type: ProfileActivityType;
  title: string;
  timestamp: string;
  icon: string;
  color: string;
  meta?: Record<string, unknown>;
}

export interface ProfileBillingItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoiceNumber: string;
  paymentMethod?: string;
}

export interface ProfileOverview {
  user: User;
  stats: ProfileStat[];
  quickActions: ProfileQuickAction[];
  achievements: ProfileAchievement[];
  recentActivity: ProfileActivityItem[];
  billingHistory: ProfileBillingItem[];
}

export interface AchievementStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  progressCurrent: number;
  progressTarget: number;
}

export interface AchievementsOverview {
  achievements: AchievementStatus[];
  unlockedCount: number;
  totalCount: number;
  totalXP: number;
  metrics: {
    guidesRead: number;
    aiQuestions: number;
    remindersCreated: number;
    remindersCompleted: number;
    docScanCount: number;
    streak: number;
    daysSinceRegistration: number;
    grantApplications: number;
    level: UserLevel;
    xp: number;
  };
}

export interface DashboardOverview {
  userProgress: UserProgress;
  dailyQuests: DailyQuest[];
  lastUpdated: string;
}

// Grant and Scholarship Types
export enum GrantType {
  GOVERNMENT = "GOVERNMENT",
  UNIVERSITY = "UNIVERSITY",
  PRIVATE = "PRIVATE",
  INTERNATIONAL = "INTERNATIONAL",
  RESEARCH = "RESEARCH",
  EXCHANGE = "EXCHANGE",
}

export enum GrantStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  COMING_SOON = "COMING_SOON",
  CLOSED = "CLOSED",
}

export enum GrantLevel {
  BACHELOR = "BACHELOR",
  MASTER = "MASTER",
  PHD = "PHD",
  POSTDOC = "POSTDOC",
  ALL = "ALL",
}

export enum GrantCategory {
  ACADEMIC = "ACADEMIC",
  RESEARCH = "RESEARCH",
  CULTURAL = "CULTURAL",
  SPORTS = "SPORTS",
  LEADERSHIP = "LEADERSHIP",
  NEED_BASED = "NEED_BASED",
  MERIT_BASED = "MERIT_BASED",
}

export interface Grant {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  type: GrantType;
  status: GrantStatus;
  level: GrantLevel;
  category: GrantCategory;
  organization: string;
  website?: string;
  applicationDeadline: string;
  startDate?: string;
  endDate?: string;
  requirements: string[];
  documents: string[];
  benefits: string[];
  eligibility: {
    countries: string[];
    ageRange?: {
      min: number;
      max: number;
    };
    gpa?: number;
    languageLevel?: string;
    studyField?: string[];
  };
  applicationProcess: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserGrantApplication {
  id: string;
  userId: string;
  grantId: string;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  documents: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrantFilter {
  type?: GrantType[];
  status?: GrantStatus[];
  level?: GrantLevel[];
  category?: GrantCategory[];
  amountRange?: {
    min: number;
    max: number;
  };
  deadlineRange?: {
    from: string;
    to: string;
  };
  countries?: string[];
  tags?: string[];
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
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  payment?: Payment;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  features: string; // JSON string from server
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface PaymentRequest {
  planId: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  paymentId: string;
  yooKassaPaymentId: string;
  confirmationUrl?: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
}

export interface TestData {
  testCards: {
    SUCCESS: string;
    FAILURE: string;
    INSUFFICIENT_FUNDS: string;
    EXPIRED: string;
    INVALID_CVC: string;
  };
  testSbpPhones: {
    SUCCESS: string;
    FAILURE: string;
  };
  instructions: {
    cards: {
      success: string;
      failure: string;
      insufficientFunds: string;
      expired: string;
      invalidCvc: string;
    };
    sbp: {
      success: string;
      failure: string;
    };
  };
}

// Gamification Types
export enum UserLevel {
  NEWBIE = "NEWBIE",           // Новичок (0-100 XP)
  ADAPTING = "ADAPTING",       // Адаптирующийся (101-300 XP)
  EXPERIENCED = "EXPERIENCED", // Опытный (301-600 XP)
  EXPERT = "EXPERT",           // Эксперт (601-1000 XP)
  LOCAL = "LOCAL",             // Местный (1001+ XP)
}

export enum AchievementCategory {
  GETTING_STARTED = "GETTING_STARTED",
  EDUCATION = "EDUCATION",
  LIFE = "LIFE",
  ACTIVITY = "ACTIVITY",
  EXPERT = "EXPERT",
}

export enum QuestType {
  READ_GUIDES = "READ_GUIDES",
  ASK_AI = "ASK_AI",
  CREATE_REMINDER = "CREATE_REMINDER",
  COMPLETE_REMINDER = "COMPLETE_REMINDER",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  DAILY_LOGIN = "DAILY_LOGIN",
}

export interface UserProgress {
  id: string;
  userId: string;
  level: UserLevel;
  xp: number;
  adaptationProgress: number; // 0-100
  streak: number; // дни подряд
  lastVisit: string;
  totalGuidesRead: number;
  totalAIQuestions: number;
  totalRemindersCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji
  xpReward: number;
  requirement: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement?: Achievement;
}

export interface DailyQuest {
  id: string;
  userId: string;
  questType: QuestType;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  date: string;
  completed: boolean;
}

export interface XPAction {
  READ_GUIDE: number;
  CREATE_REMINDER: number;
  COMPLETE_REMINDER: number;
  ASK_AI: number;
  DAILY_LOGIN: number;
  STREAK_3_DAYS: number;
  STREAK_7_DAYS: number;
  STREAK_30_DAYS: number;
  COMPLETE_PROFILE: number;
  READ_5_GUIDES: number;
}

export interface LevelConfig {
  level: UserLevel;
  minXP: number;
  maxXP: number;
  title: string;
  icon: string;
  color: string;
} 