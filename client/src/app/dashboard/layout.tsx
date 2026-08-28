import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Личный кабинет", description: "Личный кабинет пользователя AdaptEd Russia.", path: "/dashboard", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
