import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationsWrapper } from "@/components/ui/notifications-wrapper";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { HtmlLang } from "@/components/language/html-lang";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ErrorBoundary } from "@/components/auth/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "AdaptEd Russia - Помощь иностранным студентам в России",
    template: "%s | AdaptEd Russia",
  },
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах. Образовательные гайды, бытовые советы, AI-помощник и умные заметки с AI-напоминаниями.",
  keywords: [
    "иностранные студенты",
    "адаптация в России",
    "образование в России",
    "российские вузы",
    "студенческая жизнь",
    "помощь студентам",
    "AI помощник",
    "образовательные гайды",
    "бытовые советы",
  ],
  authors: [{ name: "AdaptEd Russia Team" }],
  creator: "AdaptEd Russia",
  publisher: "AdaptEd Russia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://adaptedrussia.ru"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://adaptedrussia.ru",
    title: "AdaptEd Russia - Помощь иностранным студентам в России",
    description:
      "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах.",
    siteName: "AdaptEd Russia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AdaptEd Russia - Помощь иностранным студентам",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdaptEd Russia - Помощь иностранным студентам в России",
    description:
      "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="icon" type="image/png" sizes="1024x1024" href="/AdaptEd.png" />
        <link rel="apple-touch-icon" sizes="1024x1024" href="/AdaptEd.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <LanguageProvider>
              <HtmlLang />
              <NotificationsWrapper>
                {children}
                <ConditionalFooter />
                <CookieConsent />
              </NotificationsWrapper>
            </LanguageProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
