import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Тарифы AdaptEd Russia", description: "Выберите платный тариф AdaptEd Russia для доступа к расширенным возможностям платформы.", path: "/payment" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
