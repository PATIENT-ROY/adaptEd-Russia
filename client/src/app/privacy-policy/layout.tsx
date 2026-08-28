import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Политика конфиденциальности", description: "Политика конфиденциальности и правила обработки данных пользователей платформы AdaptEd Russia.", path: "/privacy-policy" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
