import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsWrapper } from "@/components/ui/notifications-wrapper";

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
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
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
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <NotificationsWrapper>{children}</NotificationsWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
