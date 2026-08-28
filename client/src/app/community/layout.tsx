import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Сообщество", description: "Раздел сообщества AdaptEd Russia.", path: "/community", noIndex: true });

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
