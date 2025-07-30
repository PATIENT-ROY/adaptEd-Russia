"use client";

import { useEffect } from "react";

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    // Добавляем структурированные данные в head
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      // Удаляем скрипт при размонтировании
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}

// Предустановленные структурированные данные
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AdaptEd Russia",
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах",
  url: "https://adapted-russia.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://adapted-russia.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AdaptEd Russia",
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в России",
  url: "https://adapted-russia.com",
  logo: "https://adapted-russia.com/logo.png",
  sameAs: [
    "https://twitter.com/adaptedrussia",
    "https://facebook.com/adaptedrussia",
    "https://instagram.com/adaptedrussia",
  ],
};

export const educationalServiceStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalService",
  name: "AdaptEd Russia",
  description:
    "Образовательные гайды и помощь для иностранных студентов в России",
  provider: {
    "@type": "Organization",
    name: "AdaptEd Russia",
  },
  serviceType: "Образовательные гайды",
  areaServed: "Россия",
  audience: {
    "@type": "Audience",
    audienceType: "Иностранные студенты",
  },
};
