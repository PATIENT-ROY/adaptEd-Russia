"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";

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
        console.log("User and token restored from localStorage");
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else if (savedUser && !savedToken) {
      // Если есть пользователь, но нет токена, очищаем данные
      console.log("User found but no token, clearing data");
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
        // Реальный API запрос
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
          }/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          }
        );

        const data = await response.json();

        if (data.success && data.data) {
          const { user, token } = data.data;

          // Сохраняем пользователя и токен
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);

          console.log("Login successful, token saved:", token);
          return true;
        } else {
          console.error("Login failed:", data.error);
          return false;
        }
      } catch (error) {
        console.error("Login error:", error);
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
      console.log("Register function called with:", userData);
      try {
        // Реальный API запрос
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
          }/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              password: userData.password,
              country: userData.country,
              language: userData.language,
            }),
          }
        );

        const data = await response.json();

        if (data.success && data.data) {
          const { user, token } = data.data;

          // Сохраняем пользователя и токен
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);

          // Устанавливаем флаг нового пользователя
          setIsNewUser(true);
          localStorage.setItem("isNewUser", "true");

          console.log("Registration successful, token saved:", token);
          return true;
        } else {
          console.error("Registration failed:", data.error);
          return false;
        }
      } catch (error) {
        console.error("Register error:", error);
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
