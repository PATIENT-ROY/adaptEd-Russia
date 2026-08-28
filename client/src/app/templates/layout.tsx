import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "AI-инструменты", description: "AI-инструменты AdaptEd Russia для учёбы, документов, презентаций и подготовки к экзаменам.", path: "/templates", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
