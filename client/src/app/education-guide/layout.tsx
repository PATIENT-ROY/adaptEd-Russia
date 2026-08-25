import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гайды по учёбе в России для иностранных студентов",
  description:
    "Понятные материалы про российские вузы, сессию, зачёты, курсовые, академические документы и обучение иностранных студентов.",
  alternates: { canonical: "/education-guide" },
};

export default function EducationGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
