import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Достижения", description: "Личные достижения пользователя AdaptEd Russia.", path: "/achievements", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
