import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гайды по жизни в России для иностранных студентов",
  description:
    "Миграционный учёт, учебная виза, RU ID, документы, работа, медицина и бюджет иностранного студента в России.",
  alternates: { canonical: "/life-guide" },
};

export default function LifeGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
