"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";

// Используем тот же API_BASE_URL, что и в api.ts
// В браузере process.env доступен только для NEXT_PUBLIC_* переменных
// Если Next.js не перезапущен, переменная может быть undefined
const API_BASE_URL =
  (typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3003/api";

// Логируем для отладки
if (typeof window !== "undefined") {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(
    "process.env.NEXT_PUBLIC_API_URL:",
    process.env.NEXT_PUBLIC_API_URL
  );
}

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
        const loginUrl = `${API_BASE_URL}/auth/login`;
        console.log("Attempting login to:", loginUrl);
        console.log("Full URL:", loginUrl);
        console.log("API_BASE_URL value:", API_BASE_URL);

        const response = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          // Добавляем mode и credentials для CORS
          mode: "cors",
          credentials: "include",
        });

        // Получаем текст ответа для безопасного парсинга
        let data;
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        try {
          if (isJson) {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
          } else {
            // Если ответ не JSON, выбрасываем ошибку
            throw new Error(
              `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
            );
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          throw new Error(
            `Не удалось обработать ответ сервера. Статус: ${response.status}`
          );
        }

        // Проверяем статус ответа
        if (!response.ok) {
          const errorMessage =
            data?.error || data?.message || `Ошибка сервера: ${response.status}`;
          console.error("Login failed:", errorMessage);
          return false;
        }

        if (data.success && data.data) {
          const { user, token } = data.data;

          // Проверяем наличие необходимых данных
          if (!user || !token) {
            console.error("Login failed: missing user or token in response");
            return false;
          }

          // Сохраняем пользователя и токен
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);

          console.log("Login successful, token saved:", token);
          return true;
        } else {
          const errorMessage = data?.error || data?.message || "Неверный email или пароль";
          console.error("Login failed:", errorMessage);
          return false;
        }
      } catch (error) {
        console.error("Login error:", error);
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.error(
            "Network error - check if backend is running on:",
            API_BASE_URL
          );
        }
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
        const registerUrl = `${API_BASE_URL}/auth/register`;
        console.log("Attempting register to:", registerUrl);
        console.log("Full URL:", registerUrl);
        console.log("API_BASE_URL value:", API_BASE_URL);

        const response = await fetch(registerUrl, {
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
          // Добавляем mode и credentials для CORS
          mode: "cors",
          credentials: "include",
        });

        // Получаем текст ответа для безопасного парсинга
        let data;
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        try {
          if (isJson) {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
          } else {
            // Если ответ не JSON, выбрасываем ошибку
            throw new Error(
              `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
            );
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          throw new Error(
            `Не удалось обработать ответ сервера. Статус: ${response.status}`
          );
        }

        // Проверяем статус ответа
        if (!response.ok) {
          const errorMessage =
            data?.error || data?.message || `Ошибка сервера: ${response.status}`;
          console.error("Registration failed:", errorMessage);
          return false;
        }

        if (data.success && data.data) {
          const { user, token } = data.data;

          // Проверяем наличие необходимых данных
          if (!user || !token) {
            console.error("Registration failed: missing user or token in response");
            return false;
          }

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
          const errorMessage = data?.error || data?.message || "Ошибка при регистрации";
          console.error("Registration failed:", errorMessage);
          return false;
        }
      } catch (error) {
        console.error("Register error:", error);
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.error(
            "Network error - check if backend is running on:",
            API_BASE_URL
          );
        }
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
