interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

// Предустановленные структурированные данные
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AdaptEd Russia",
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах",
  url: "https://adaptedrussia.ru",
};

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AdaptEd Russia",
  description:
    "Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в России",
  url: "https://adaptedrussia.ru",
  logo: {
    "@type": "ImageObject",
    url: "https://adaptedrussia.ru/AdaptEd.png",
    width: 1024,
    height: 1024,
  },
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
