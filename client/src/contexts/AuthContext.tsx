"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@/types";
import { Language, Role, Plan } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "password">
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
  isNewUser: boolean;
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Проверяем сохраненного пользователя в localStorage
    const savedUser = localStorage.getItem("user");
    const savedNewUserFlag = localStorage.getItem("isNewUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }

    // Восстанавливаем флаг нового пользователя
    if (savedNewUserFlag === "true") {
      setIsNewUser(true);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Моковые данные пользователя
      const mockUser: User = {
        id: "1",
        name: email.includes("admin")
          ? "Анна Петрова (Админ)"
          : "Ахмед Аль-Махмуд",
        email,
        language: Language.RU,
        role: email.includes("admin") ? Role.ADMIN : Role.STUDENT,
        plan: Plan.FREEMIUM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "password">
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Устанавливаем флаг нового пользователя
      setIsNewUser(true);
      localStorage.setItem("isNewUser", "true");

      return true;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Сохраняем информацию о выходе для показа уведомления
    const userName = user?.name.split(" ")[0] || "Пользователь";
    localStorage.setItem(
      "logoutNotification",
      JSON.stringify({
        userName,
        timestamp: Date.now(),
      })
    );

    // Очищаем данные пользователя
    setUser(null);
    setIsNewUser(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isNewUser");

    // Перенаправляем на главную страницу
    window.location.href = "/";
  };

  const clearNewUserFlag = () => {
    setIsNewUser(false);
    localStorage.removeItem("isNewUser");
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedUser: User = {
        ...user,
        ...userData,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error("Update profile error:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        isLoading,
        isNewUser,
        clearNewUserFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
