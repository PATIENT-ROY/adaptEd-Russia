import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "AdaptEd AI", description: "AI-помощник и готовые инструменты AdaptEd Russia для учёбы и жизни.", path: "/ai-helper", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
