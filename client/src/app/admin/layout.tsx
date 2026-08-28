import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Панель администратора", description: "Управление платформой AdaptEd Russia.", path: "/admin", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
