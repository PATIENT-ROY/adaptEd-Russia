import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Вход", description: "Вход в личный кабинет AdaptEd Russia.", path: "/login", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
