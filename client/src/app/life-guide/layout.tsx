import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  "title": "Гайды по жизни в России для иностранных студентов",
  "description": "Миграционный учёт, учебная виза, RU ID, документы, работа, медицина и бюджет иностранного студента в России.",
  "path": "/life-guide"
});

export default function GuideCatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
