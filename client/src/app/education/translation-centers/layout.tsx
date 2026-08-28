import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Центры перевода документов для иностранных студентов", description: "Как выбрать центр перевода, подготовить нотариальный перевод и оформить документы для учёбы и жизни в России.", path: "/education/translation-centers" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
