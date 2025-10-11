"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Heart,
  Shield,
  BookOpen,
  Globe,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  const footerLinks = {
    platform: [
      { href: "/dashboard", label: "Главная" },
      { href: "/education-guide", label: "Учёба" },
      { href: "/life-guide", label: "Быт" },
      // AI Помощник и Напоминания только для авторизованных пользователей
      ...(user
        ? [
            { href: "/ai-helper", label: "AI Помощник" },
            { href: "/reminders", label: "Напоминания" },
          ]
        : []),
    ],
    support: [
      { href: "/support", label: "Поддержка" },
      // Убираем дублирование - "Политика конфиденциальности" только внизу
    ],
  };

  const socialLinks = [
    { href: "#", icon: Facebook, label: "Facebook" },
    { href: "#", icon: Twitter, label: "Twitter" },
    { href: "#", icon: Instagram, label: "Instagram" },
    { href: "#", icon: Linkedin, label: "LinkedIn" },
    { href: "#", icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white footer-animate">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1 footer-link-animate">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                  A
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base lg:text-lg font-bold text-white">
                  AdaptEd
                </span>
                <span className="text-sm sm:text-base lg:text-lg font-bold text-blue-400">
                  Russia
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
              Помогаем иностранным студентам адаптироваться к жизни и учёбе в
              российских вузах. Образовательные гайды, бытовые советы и
              AI-помощник.
            </p>
            <div className="flex space-x-2 sm:space-x-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg bg-slate-700 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg footer-icon-animate"
                    aria-label={social.label}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-slate-300 hover:text-white" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div
            className="footer-link-animate"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
              Платформа
            </h3>
            <ul className="space-y-0.5 sm:space-y-1">
              {footerLinks.platform.map((link, index) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-slate-300 hover:text-blue-400 transition-colors duration-300 hover:translate-x-1 inline-block py-0.5"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div
            className="footer-link-animate"
            style={{ animationDelay: "400ms" }}
          >
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
              Поддержка
            </h3>
            <ul className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
              {footerLinks.support.map((link, index) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-slate-300 hover:text-blue-400 transition-colors duration-300 hover:translate-x-1 inline-block py-0.5"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <span className="break-all">support@adapted-russia.com</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <span>+7 (495) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <span>Екатеринбург, Россия</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 text-slate-400 text-xs sm:text-sm text-center sm:text-left">
              <span>© {currentYear} AdaptEd Russia. Все права защищены.</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Сделано с</span>
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 inline" />
              <span className="hidden sm:inline">в России</span>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
              <Link
                href="/privacy-policy"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center"
              >
                Политика конфиденциальности
              </Link>
              <div className="flex items-center space-x-1 sm:space-x-2 text-slate-400">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="flex items-center">RU</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
