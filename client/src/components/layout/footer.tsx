"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getCurrentYear } from "@/lib/date-utils";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Heart,
  Shield,
  BookOpen,
  Globe,
  FileText,
} from "lucide-react";

export function Footer() {
  const currentYear = getCurrentYear();
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const footerLinks = {
    platform: [
      { href: user ? "/dashboard" : "/", labelKey: "nav.home" },
      { href: "/education-guide", labelKey: "nav.education" },
      { href: "/life-guide", labelKey: "nav.life" },
      ...(user
        ? [{ href: "/reminders", labelKey: "nav.reminders" }]
        : []),
      { href: "/support", labelKey: "footer.support" },
    ],
    features: user
      ? [
          { href: "/ai-helper", labelKey: "nav.aiHelper" },
          { href: "/docscan", labelKey: "nav.docscan" },
        ]
      : [],
  };

  const socialLinks = [
    {
      href: "https://t.me/adaptEd_russia",
      type: "telegram" as const,
      labelKey: "footer.social.telegram",
    },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white footer-animate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
      >
        <div className="absolute h-56 w-56 rounded-full bg-blue-500/10 blur-[90px] sm:h-96 sm:w-96" />
        <div className="text-center font-black leading-[0.82] tracking-[-0.065em] opacity-20 sm:flex sm:items-center sm:gap-[0.12em] sm:leading-none">
          <span
            className="block text-[clamp(5rem,12vw,12rem)] text-transparent"
            style={{ WebkitTextStroke: "1.5px rgba(96, 165, 250, 0.42)" }}
          >
            AdaptEd
          </span>
          <span
            className="block text-[clamp(5rem,12vw,12rem)] text-transparent"
            style={{ WebkitTextStroke: "1.5px rgba(196, 181, 253, 0.42)" }}
          >
            Russia
          </span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1 footer-link-animate">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/AdaptEd.png"
                  alt="AdaptEd Russia Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 32px, (max-width: 1024px) 32px, 40px"
                />
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
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              {socialLinks.map((social, index) => {
                const label = t(social.labelKey);
                return (
                  <a
                    key={social.type}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-11 items-start gap-3 rounded-lg p-0.5 text-slate-300 transition-colors duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
                    aria-label={t("footer.telegram.subscribe")}
                    title={label}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-slate-600 text-blue-400 transition-all duration-300 group-hover:bg-slate-500 footer-icon-animate">
                      {social.type === "telegram" ? (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <span className="text-xs sm:text-sm font-bold leading-none">
                          VK
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 text-xs leading-relaxed sm:text-sm">
                      <span className="block font-medium text-white">{t("footer.telegram.subscribe")}</span>
                      <span className="block">{t("footer.telegram.news")}</span>
                    </span>
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
              {t("footer.platform")}
            </h3>
            <ul className="mb-3 space-y-2 sm:mb-4 sm:space-y-1">
              {footerLinks.platform.map((link, index) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block min-h-0 py-0 text-xs text-slate-300 transition-colors duration-300 hover:translate-x-1 hover:text-blue-400 sm:py-0.5 sm:text-sm"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features & Contact */}
          <div
            className="footer-link-animate"
            style={{ animationDelay: "400ms" }}
          >
            {user && footerLinks.features.length > 0 ? (
              <>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
                  {t("footer.features")}
                </h3>
                <ul className="mb-3 space-y-2 sm:mb-4 sm:space-y-1">
                  {footerLinks.features.map((link, index) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block min-h-0 py-0 text-xs text-slate-300 transition-colors duration-300 hover:translate-x-1 hover:text-blue-400 sm:py-0.5 sm:text-sm"
                        style={{ animationDelay: `${(index + 1) * 50}ms` }}
                      >
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {/* Contact Info */}
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
              {t("footer.contacts")}
            </h3>
            <div className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <a
                  href="mailto:support@adaptedrussia.ru"
                  className="min-h-0 break-all transition-colors hover:text-blue-400"
                >
                  support@adaptedrussia.ru
                </a>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <a
                  href="tel:+79221006983"
                  aria-label="+7 (922) 100-69-83"
                  className="group min-h-0 transition-colors hover:text-blue-400"
                >
                  +7 (922) 100-69-<span aria-hidden="true" className="inline-block opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100 group-focus:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">83</span>
                </a>
              </div>
              <a
                href="https://wa.me/79221006983"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 w-fit items-center gap-2 rounded text-xs text-slate-300 transition-colors hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 sm:gap-3 sm:text-sm"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0 text-blue-400 sm:h-4 sm:w-4">
                  <path d="M20.52 3.48A11.88 11.88 0 0 0 12.05 0C5.48 0 .13 5.35.13 11.92c0 2.1.55 4.15 1.6 5.96L.04 24l6.26-1.64a11.9 11.9 0 0 0 5.74 1.46h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.45-8.42ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.24-.38a9.87 9.87 0 0 1-1.51-5.26c0-5.46 4.44-9.9 9.91-9.9a9.84 9.84 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.9-9.94 9.88Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                </svg>
                {t("footer.whatsapp")}
              </a>
              <div className="flex items-center space-x-2 sm:space-x-3 text-slate-300 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
            </div>

            {/* Requisites */}
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400" />
              {t("footer.requisites")}
            </h3>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="text-slate-300 text-xs sm:text-sm">
                {t("footer.legalEntity")}
              </div>
              <div className="text-slate-300 text-xs sm:text-sm">
                {t("footer.inn")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-slate-700">
        <div className="mx-auto max-w-screen-2xl px-3 pb-16 pt-3 sm:px-4 sm:py-4 lg:px-8 lg:py-5">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
            <div className="order-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-slate-400 sm:order-1 sm:justify-start sm:text-left sm:text-sm">
              <span className="whitespace-nowrap">
                © {currentYear} AdaptEd Russia. {t("footer.copyright")}.
              </span>
              <span>|</span>
              <span>{t("footer.madeWith")}</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>{t("footer.inRussia")}</span>
            </div>

            <div className="order-1 grid w-full grid-cols-1 items-center justify-items-center gap-y-2 text-center text-xs sm:order-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-4 sm:gap-y-1 sm:text-sm lg:pr-20">
              <a
                href="/safety"
                className="col-span-2 min-h-0 leading-snug text-slate-400 transition-colors duration-300 hover:text-blue-400 sm:col-span-1"
              >
                {t("footer.safety")}
              </a>
              <Link
                href="/privacy-policy"
                className="col-span-2 min-h-0 leading-snug text-slate-400 transition-colors duration-300 hover:text-blue-400 sm:col-span-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/offer"
                className="col-span-2 min-h-0 leading-snug text-slate-400 transition-colors duration-300 hover:text-blue-400 sm:col-span-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footer.offer")}
              </Link>
              <div className="flex items-center justify-center gap-2 whitespace-nowrap sm:contents">
                <Link
                  href="/personal-data-consent"
                  className="min-h-0 leading-snug text-slate-400 transition-colors duration-300 hover:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("footer.personalDataConsent")}
                </Link>
                <div
                  className="flex items-center justify-center space-x-1 text-slate-400 sm:space-x-2"
                  aria-label={currentLanguage}
                >
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{currentLanguage}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
