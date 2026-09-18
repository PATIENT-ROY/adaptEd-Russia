import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Публичная оферта",
  description: "Условия оказания информационно-консультационных услуг платформы AdaptEd Russia.",
  path: "/offer",
});

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
