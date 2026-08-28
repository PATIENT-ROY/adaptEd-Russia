import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Регистрация", description: "Создание аккаунта AdaptEd Russia.", path: "/register", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
