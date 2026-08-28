import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Установка пароля", description: "Установка нового пароля аккаунта AdaptEd Russia.", path: "/set-password", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
