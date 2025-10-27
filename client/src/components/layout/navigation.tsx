"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Home,
  BookOpen,
  Home as HomeIcon,
  Bell,
  MessageSquare,
  User,
  Menu,
  X,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import type { Language } from "@/types";
import { Role } from "@/types";

interface NavigationProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const navigationItemsConfig = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/education-guide", labelKey: "nav.education", icon: BookOpen },
  { href: "/life-guide", labelKey: "nav.life", icon: HomeIcon },
  { href: "/support", labelKey: "nav.support", icon: HelpCircle },
];

const authenticatedNavigationItemsConfig = [
  { href: "/reminders", labelKey: "nav.reminders", icon: Bell },
  { href: "/ai-helper", labelKey: "nav.aiHelper", icon: MessageSquare },
];

export function Navigation({
  currentLanguage,
  onLanguageChange,
}: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <nav
      className="modern-nav sticky top-0 z-50"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(15px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="mx-auto max-w-screen-2xl w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 lg:h-18 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 sm:space-x-3 group"
            >
              <div className="h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xs sm:text-base lg:text-lg">
                  A
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                <span className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                  AdaptEd
                </span>
                <span className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                  Russia
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {/* Основная навигация для всех */}
            {navigationItemsConfig.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "modern-nav-item flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                  style={{
                    position: "relative",
                    textDecoration: "none",
                  }}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors duration-200",
                      isActive ? "text-blue-600" : "text-slate-500"
                    )}
                  />
                  <span>{t(item.labelKey)}</span>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        left: "0",
                        width: "100%",
                        height: "2px",
                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        borderRadius: "1px",
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Дополнительная навигация только для авторизованных пользователей */}
            {user &&
              authenticatedNavigationItemsConfig.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "modern-nav-item flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                    style={{
                      position: "relative",
                      textDecoration: "none",
                    }}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors duration-200",
                        isActive ? "text-blue-600" : "text-slate-500"
                      )}
                    />
                    <span>{t(item.labelKey)}</span>
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          left: "0",
                          width: "100%",
                          height: "2px",
                          background:
                            "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                          borderRadius: "1px",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
          </div>

          {/* Right side - Language Switcher, Profile, Mobile Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            {/* Profile Button */}
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {user.role === Role.ADMIN && (
                  <Link href="/admin">
                    <Button className="rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3 font-medium">
                      <Shield className="mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      <span className="hidden sm:inline">{t("nav.admin")}</span>
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="rounded-lg sm:rounded-xl border-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3"
                  >
                    <User className="mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    <span className="hidden sm:inline">
                      {user.name.split(" ")[0]}
                    </span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="rounded-lg sm:rounded-xl text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3"
                  >
                    {t("nav.login")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="outline"
              className="lg:hidden rounded-lg sm:rounded-xl p-1.5 sm:p-2 h-7 sm:h-8 w-7 sm:w-8"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 bg-white animate-slide-in-from-top">
            <div className="space-y-2">
              {/* Основная навигация для всех */}
              {navigationItemsConfig.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105",
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: "both",
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-blue-600" : "text-slate-500"
                      )}
                    />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}

              {/* Дополнительная навигация только для авторизованных пользователей */}
              {user &&
                authenticatedNavigationItemsConfig.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105",
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                      style={{
                        animationDelay: `${
                          (navigationItemsConfig.length + index) * 100
                        }ms`,
                        animationFillMode: "both",
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-blue-600" : "text-slate-500"
                        )}
                      />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  );
                })}

              {/* Admin Panel Link for Mobile */}
              {user?.role === Role.ADMIN && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
                  style={{
                    animationDelay: `${
                      (navigationItemsConfig.length +
                        (user
                          ? authenticatedNavigationItemsConfig.length
                          : 0)) *
                      100
                    }ms`,
                    animationFillMode: "both",
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
