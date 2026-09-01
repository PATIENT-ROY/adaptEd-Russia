"use client";

import { LOGOUT_NOTIFICATION_EVENT, useAuth } from "@/contexts/AuthContext";
import { WelcomeNotification } from "./welcome-notification";
import { LogoutNotification } from "./logout-notification";
import { useState, useEffect, useCallback } from "react";

interface NotificationsWrapperProps {
  children: React.ReactNode;
}

type LogoutInfo = {
  userName: string;
  timestamp: number;
};

export function NotificationsWrapper({ children }: NotificationsWrapperProps) {
  const { user, isNewUser, clearNewUserFlag } = useAuth();
  const [logoutInfo, setLogoutInfo] = useState<LogoutInfo | null>(null);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const showLogout = useCallback((info: LogoutInfo) => {
    if (Date.now() - info.timestamp >= 10000) {
      localStorage.removeItem("logoutNotification");
      return;
    }
    setLogoutInfo(info);
    setShowLogoutNotification(true);
    localStorage.removeItem("logoutNotification");
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const saved = localStorage.getItem("logoutNotification");
    if (saved) {
      try {
        showLogout(JSON.parse(saved) as LogoutInfo);
      } catch {
        localStorage.removeItem("logoutNotification");
      }
    }

    const onLogout = (event: Event) => {
      const detail = (event as CustomEvent<LogoutInfo>).detail;
      if (detail?.userName && detail.timestamp) {
        showLogout(detail);
      }
    };

    window.addEventListener(LOGOUT_NOTIFICATION_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_NOTIFICATION_EVENT, onLogout);
  }, [isClient, showLogout]);

  return (
    <>
      {children}

      {isClient && user && (
        <WelcomeNotification
          userName={user.name.split(" ")[0]}
          isVisible={isNewUser}
          onClose={clearNewUserFlag}
        />
      )}

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
