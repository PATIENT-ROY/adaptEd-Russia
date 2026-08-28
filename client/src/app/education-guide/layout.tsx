import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  "title": "Гайды по учёбе в России для иностранных студентов",
  "description": "Понятные материалы про российские вузы, сессию, зачёты, курсовые, академические документы и обучение иностранных студентов.",
  "path": "/education-guide"
});

export default function GuideCatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
