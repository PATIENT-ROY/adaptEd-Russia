"use client";

import { useAuth } from "@/contexts/AuthContext";
import { WelcomeNotification } from "./welcome-notification";
import { LogoutNotification } from "./logout-notification";
import { useState, useEffect } from "react";

interface NotificationsWrapperProps {
  children: React.ReactNode;
}

export function NotificationsWrapper({ children }: NotificationsWrapperProps) {
  const { user, isNewUser, clearNewUserFlag } = useAuth();
  const [logoutInfo, setLogoutInfo] = useState<{
    userName: string;
    timestamp: number;
  } | null>(null);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Проверяем, есть ли информация о выходе
    const savedLogoutInfo = localStorage.getItem("logoutNotification");
    if (savedLogoutInfo) {
      try {
        const parsedInfo = JSON.parse(savedLogoutInfo);
        // Проверяем, что уведомление не старше 10 секунд
        if (Date.now() - parsedInfo.timestamp < 10000) {
          setLogoutInfo(parsedInfo);
          setShowLogoutNotification(true);
          // Удаляем информацию о выходе
          localStorage.removeItem("logoutNotification");
        } else {
          localStorage.removeItem("logoutNotification");
        }
      } catch (error) {
        localStorage.removeItem("logoutNotification");
      }
    }
  }, [isClient]);

  return (
    <>
      {children}

      {/* Welcome Notification for new users */}
      {isClient && user && (
        <WelcomeNotification
          userName={user.name.split(" ")[0]}
          isVisible={isNewUser}
          onClose={clearNewUserFlag}
        />
      )}

      {/* Logout Notification */}
      {isClient && logoutInfo && (
        <LogoutNotification
          userName={logoutInfo.userName}
          isVisible={showLogoutNotification}
          onClose={() => setShowLogoutNotification(false)}
        />
      )}
    </>
  );
}
