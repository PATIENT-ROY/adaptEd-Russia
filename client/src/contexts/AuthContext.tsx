"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User, UpdateProfileRequest } from "@/types";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "password"> & {
      password: string;
      country: string;
    }
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
    // Проверяем сохраненного пользователя и токен в localStorage
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const savedNewUserFlag = localStorage.getItem("isNewUser");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else if (savedUser && !savedToken) {
      // Если есть пользователь, но нет токена, очищаем данные
      localStorage.removeItem("user");
      localStorage.removeItem("isNewUser");
    }

    // Восстанавливаем флаг нового пользователя
    if (savedNewUserFlag === "true") {
      setIsNewUser(true);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const response = await apiClient.login({ email, password });
        
        if (response?.user && response?.token) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (
      userData: Omit<User, "id" | "createdAt" | "updatedAt" | "password"> & {
        password: string;
        country: string;
      }
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        const response = await apiClient.register({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          country: userData.country,
          language: userData.language,
        });
        
        if (response?.user && response?.token) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
          setIsNewUser(true);
          localStorage.setItem("isNewUser", "true");
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    // Сохраняем информацию о выходе для показа уведомления
    const userName = user?.name.split(" ")[0] || "Пользователь";
    localStorage.setItem(
      "logoutNotification",
      JSON.stringify({
        userName,
        timestamp: Date.now(),
      })
    );

    // Очищаем данные пользователя и токен
    setUser(null);
    setIsNewUser(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isNewUser");
    localStorage.removeItem("token");

    // Перенаправляем на главную страницу
    window.location.href = "/";
  }, [user]);

  const clearNewUserFlag = useCallback(() => {
    setIsNewUser(false);
    localStorage.removeItem("isNewUser");
  }, []);

  const updateProfile = useCallback(
    async (userData: Partial<User>): Promise<boolean> => {
      if (!user) return false;

      try {
        const payload: UpdateProfileRequest = {};

        if (userData.university !== undefined) {
          payload.university = userData.university || undefined;
        }
        if (userData.faculty !== undefined) {
          payload.faculty = userData.faculty || undefined;
        }
        if (userData.year !== undefined) {
          payload.year = userData.year || undefined;
        }
        if (userData.phone !== undefined) {
          payload.phone = userData.phone || undefined;
        }
        if (userData.language !== undefined) {
          payload.language = userData.language;
        }
        if (userData.gender !== undefined) {
          const normalizedGender =
            userData.gender === "male"
              ? "MALE"
              : userData.gender === "female"
              ? "FEMALE"
              : undefined;
          if (normalizedGender) {
            payload.gender = normalizedGender;
          }
        }

        const updatedUser = await apiClient.updateProfile(payload);

        const mergedUser: User = {
          ...user,
          ...updatedUser,
          city: userData.city ?? user.city,
        };

        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        return true;
      } catch (error) {
        console.error("Update profile error:", error);
        return false;
      }
    },
    [user]
  );

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
