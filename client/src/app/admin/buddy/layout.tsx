import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AdaptEd Buddy — заявки",
  description: "Административная обработка заявок AdaptEd Buddy.",
  path: "/admin/buddy",
  noIndex: true,
});

export default function BuddyAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
