import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationsWrapper } from "@/components/ui/notifications-wrapper";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { HtmlLang } from "@/components/language/html-lang";
import { CookieConsent } from "@/components/ui/cookie-consent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AdaptEd Russia - Помощь иностранным студентам в России",
    template: "%s | AdaptEd Russia",
  },
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах. Образовательные гайды, бытовые советы, AI-помощник и умные напоминания.",
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
  metadataBase: new URL("https://adapted-russia.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://adapted-russia.com",
    title: "AdaptEd Russia - Помощь иностранным студентам в России",
    description:
      "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах.",
    siteName: "AdaptEd Russia",
    images: [
      {
        url: "/favicon.svg",
        width: 32,
        height: 32,
        alt: "AdaptEd Russia - Помощь иностранным студентам",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdaptEd Russia - Помощь иностранным студентам в России",
    description:
      "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах.",
    images: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon.svg?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon.svg?v=2"
        />
        <link rel="apple-touch-icon" href="/favicon.svg?v=2" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
