import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Согласие на обработку персональных данных", description: "Условия согласия пользователя на обработку персональных данных платформой AdaptEd Russia.", path: "/personal-data-consent" });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
