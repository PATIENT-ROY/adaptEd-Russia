import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "DocScan", description: "Проверка документов пользователя AdaptEd Russia.", path: "/docscan", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
