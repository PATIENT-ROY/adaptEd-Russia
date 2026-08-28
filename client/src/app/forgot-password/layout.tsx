import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Восстановление пароля", description: "Восстановление доступа к аккаунту AdaptEd Russia.", path: "/forgot-password", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
