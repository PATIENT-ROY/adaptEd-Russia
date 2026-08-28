import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Профиль", description: "Профиль пользователя AdaptEd Russia.", path: "/profile", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
