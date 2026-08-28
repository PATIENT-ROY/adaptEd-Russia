import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Тестирование платежа", description: "Служебная страница тестирования платежей.", path: "/payment/test", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
