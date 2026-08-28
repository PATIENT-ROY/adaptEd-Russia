import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Напоминания", description: "Личные напоминания пользователя AdaptEd Russia.", path: "/reminders", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
