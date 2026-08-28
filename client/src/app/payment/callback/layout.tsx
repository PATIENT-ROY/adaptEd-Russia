import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Статус платежа", description: "Проверка статуса платежа AdaptEd Russia.", path: "/payment/callback", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
