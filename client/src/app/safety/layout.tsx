import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Правила безопасности платформы",
  description:
    "Правила поведения на AdaptEd Russia: что нельзя делать, когда аккаунт блокируют или удаляют, и куда писать, если это ошибка.",
  path: "/safety",
});

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
