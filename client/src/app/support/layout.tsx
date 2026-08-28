import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Поддержка иностранных студентов", description: "Свяжитесь с поддержкой AdaptEd Russia по вопросам учёбы, документов, сервисов и адаптации в России.", path: "/support" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
